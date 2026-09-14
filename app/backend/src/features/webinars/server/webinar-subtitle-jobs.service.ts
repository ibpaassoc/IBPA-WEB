import { randomUUID } from "node:crypto";
import { requireDb } from "@/lib/db";
import { createPresignedR2GetUrl, putTextToR2 } from "./r2-storage";
import { findWebinarById } from "./webinar.repository";
import {
  appendSubtitleRevision,
  createSubtitleVersion,
  findSubtitleVersion,
  isSubtitleJobStale,
  replaceSubtitleVersion,
  subtitleRevisionKey,
  withSubtitleJob,
  withSubtitleJobFailure,
  withSubtitleJobHeartbeat,
  type SubtitleJob,
  type SubtitleVersion,
  type WebinarSubtitleState,
} from "./webinar-subtitle-state";
import {
  countVttCues,
  mutateWebinarSubtitleState,
} from "./webinar-subtitles.service";
import {
  assertTranscriptionConfigured,
  getTranscriptionStatus,
  getTranscriptionVtt,
  submitRussianTranscription,
  TRANSCRIPTION_PROVIDER,
} from "./webinar-transcription";
import { normalizeGeneratedVtt } from "./webinar-vtt";

const activeJobs = new Set<string>();
const POLL_INTERVAL_MS = 15_000;
const HEARTBEAT_INTERVAL_MS = 60_000;
const MAX_TRANSCRIPTION_MS = 12 * 60 * 60 * 1000;
const MAX_CONSECUTIVE_POLL_ERRORS = 5;
const SIGNED_AUDIO_URL_TTL_SECONDS = 12 * 60 * 60;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

/** Writes an immutable revision object; keys are unique per revision id. */
export async function writeSubtitleRevisionObject(input: {
  webinarId: string;
  versionId: string;
  revisionId: string;
  vtt: string;
  metadata?: Record<string, string>;
}) {
  const storageKey = subtitleRevisionKey(
    input.webinarId,
    input.versionId,
    input.revisionId,
  );
  const result = await putTextToR2({
    key: storageKey,
    text: input.vtt,
    metadata: input.metadata,
    requireAbsent: true,
  });
  return {
    storageKey,
    etag: result.etag,
    cueCount: countVttCues(input.vtt),
    byteSize: Buffer.byteLength(input.vtt, "utf8"),
  };
}

export async function updateSubtitleVersion(
  webinarId: string,
  versionId: string,
  update: (version: SubtitleVersion) => SubtitleVersion | null,
) {
  return mutateWebinarSubtitleState<SubtitleVersion | null>(
    webinarId,
    ({ state }) => {
      const version = findSubtitleVersion(state, versionId);
      const next = version ? update(version) : null;
      if (!next) return { abort: null };
      return { state: replaceSubtitleVersion(state, next), result: next };
    },
  );
}

export async function failSubtitleJob(
  webinarId: string,
  versionId: string,
  error: unknown,
  fallback: string,
) {
  const message = errorMessage(error, fallback);
  console.error("[Webinar subtitles] Job failed", {
    webinarId,
    versionId,
    error: message,
  });
  try {
    await updateSubtitleVersion(webinarId, versionId, (version) =>
      version.status === "PROCESSING"
        ? withSubtitleJobFailure(version, message, new Date())
        : null,
    );
  } catch (writeError) {
    console.error("[Webinar subtitles] Could not record job failure", {
      webinarId,
      versionId,
      error: errorMessage(writeError, "unknown"),
    });
  }
}

export function isSubtitleJobActive(versionId: string) {
  return activeJobs.has(versionId);
}

/** Runs a background job at most once per process for a version. */
export function runSubtitleJob(versionId: string, job: () => Promise<void>) {
  if (activeJobs.has(versionId)) return;
  activeJobs.add(versionId);
  void job().finally(() => activeJobs.delete(versionId));
}

function transcriptionJob(now: Date): SubtitleJob {
  return {
    type: "TRANSCRIPTION",
    provider: TRANSCRIPTION_PROVIDER,
    providerJobId: null,
    startedAt: now.toISOString(),
    heartbeatAt: now.toISOString(),
    progress: null,
  };
}

export async function startRussianTranscript(
  webinarId: string,
  actor: string | null,
) {
  const webinar = await findWebinarById(requireDb(), webinarId);
  if (!webinar) return { outcome: "not-found" as const };
  if (webinar.status !== "IMPORTED" || !webinar.videoR2Key) {
    return { outcome: "no-video" as const };
  }
  assertTranscriptionConfigured();

  const now = new Date();
  const versionId = randomUUID();
  const claim = await mutateWebinarSubtitleState<string>(
    webinarId,
    ({ state }) => {
      const running = state.versions.find(
        (version) =>
          version.kind === "RU_AI" &&
          version.status === "PROCESSING" &&
          !isSubtitleJobStale(version, now),
      );
      if (running) return { abort: running.id };

      const version = withSubtitleJob(
        createSubtitleVersion({
          id: versionId,
          kind: "RU_AI",
          origin: {
            type: "AI_TRANSCRIPTION",
            provider: TRANSCRIPTION_PROVIDER,
          },
          status: "PROCESSING",
          createdBy: actor,
          now,
        }),
        transcriptionJob(now),
        now,
      );
      return { state: replaceSubtitleVersion(state, version), result: versionId };
    },
  );

  if (claim.outcome === "not-found") return { outcome: "not-found" as const };
  if (claim.outcome === "aborted") {
    return { outcome: "in-progress" as const, versionId: claim.result };
  }

  const videoKey = webinar.videoR2Key;
  runSubtitleJob(versionId, () =>
    submitAndPollTranscription(webinarId, versionId, videoKey),
  );
  return { outcome: "started" as const, versionId };
}

async function submitAndPollTranscription(
  webinarId: string,
  versionId: string,
  videoKey: string,
) {
  try {
    const audioUrl = await createPresignedR2GetUrl(
      videoKey,
      SIGNED_AUDIO_URL_TTL_SECONDS,
    );
    const providerJobId = await submitRussianTranscription(audioUrl);
    const stored = await updateSubtitleVersion(webinarId, versionId, (version) =>
      version.status === "PROCESSING"
        ? withSubtitleJobHeartbeat(version, new Date(), { providerJobId })
        : null,
    );
    if (stored.outcome !== "saved") return;
    await pollTranscription(webinarId, versionId, providerJobId);
  } catch (error) {
    await failSubtitleJob(
      webinarId,
      versionId,
      error,
      "The Russian transcript could not be generated.",
    );
  }
}

async function pollTranscription(
  webinarId: string,
  versionId: string,
  providerJobId: string,
) {
  const startedAt = Date.now();
  let lastHeartbeat = Date.now();
  let consecutiveErrors = 0;

  for (;;) {
    if (Date.now() - startedAt > MAX_TRANSCRIPTION_MS) {
      throw new Error(
        "Transcription did not finish within 12 hours. Retry to run it again.",
      );
    }

    let status;
    try {
      status = await getTranscriptionStatus(providerJobId);
      consecutiveErrors = 0;
    } catch (error) {
      consecutiveErrors += 1;
      if (consecutiveErrors >= MAX_CONSECUTIVE_POLL_ERRORS) throw error;
      await sleep(POLL_INTERVAL_MS);
      continue;
    }

    if (status.status === "error") throw new Error(status.error);
    if (status.status === "completed") {
      await completeTranscription(webinarId, versionId, providerJobId);
      return;
    }

    if (Date.now() - lastHeartbeat > HEARTBEAT_INTERVAL_MS) {
      const beat = await updateSubtitleVersion(webinarId, versionId, (version) =>
        version.status === "PROCESSING" &&
        version.job?.providerJobId === providerJobId
          ? withSubtitleJobHeartbeat(version, new Date())
          : null,
      );
      // The version was retried or removed elsewhere; stop this poller.
      if (beat.outcome !== "saved") return;
      lastHeartbeat = Date.now();
    }

    await sleep(POLL_INTERVAL_MS);
  }
}

async function completeTranscription(
  webinarId: string,
  versionId: string,
  providerJobId: string,
) {
  const vtt = normalizeGeneratedVtt(await getTranscriptionVtt(providerJobId));
  const revisionId = randomUUID();
  const object = await writeSubtitleRevisionObject({
    webinarId,
    versionId,
    revisionId,
    vtt,
    metadata: {
      kind: "RU_AI",
      provider: TRANSCRIPTION_PROVIDER,
      "provider-job-id": providerJobId,
    },
  });
  await updateSubtitleVersion(webinarId, versionId, (version) =>
    version.status === "PROCESSING" &&
    version.job?.providerJobId === providerJobId
      ? appendSubtitleRevision(version, {
          id: revisionId,
          kind: "INITIAL",
          ...object,
          note: "AI transcript generated from the webinar audio",
          restoredFromRevisionId: null,
          createdBy: version.createdBy,
          now: new Date(),
        })
      : null,
  );
}

/**
 * Picks up jobs whose worker stopped (backend restart or another instance).
 * Transcriptions with a provider job id resume polling; anything else is
 * marked failed so the admin can retry deliberately.
 */
export function resumeInterruptedSubtitleJobs(
  webinarId: string,
  state: WebinarSubtitleState,
  resumers: Partial<
    Record<SubtitleJob["type"], (version: SubtitleVersion) => void>
  > = {},
) {
  const now = new Date();
  for (const version of state.versions) {
    if (activeJobs.has(version.id) || !isSubtitleJobStale(version, now)) {
      continue;
    }
    const job = version.job;
    if (job?.type === "TRANSCRIPTION" && job.providerJobId) {
      const providerJobId = job.providerJobId;
      runSubtitleJob(version.id, async () => {
        try {
          // Claim with a fresh heartbeat so other instances leave it alone.
          const claimed = await updateSubtitleVersion(
            webinarId,
            version.id,
            (current) =>
              current.job?.providerJobId === providerJobId &&
              isSubtitleJobStale(current, new Date())
                ? withSubtitleJobHeartbeat(current, new Date())
                : null,
          );
          if (claimed.outcome !== "saved") return;
          await pollTranscription(webinarId, version.id, providerJobId);
        } catch (error) {
          await failSubtitleJob(
            webinarId,
            version.id,
            error,
            "The Russian transcript could not be generated.",
          );
        }
      });
      continue;
    }
    const resume = job ? resumers[job.type] : undefined;
    if (resume) {
      resume(version);
      continue;
    }
    void failSubtitleJob(
      webinarId,
      version.id,
      new Error("This job was interrupted. Retry to run it again."),
      "This job was interrupted.",
    );
  }
}

export async function retryRussianTranscript(
  webinarId: string,
  versionId: string,
) {
  const webinar = await findWebinarById(requireDb(), webinarId);
  if (!webinar) return { outcome: "not-found" as const };
  if (webinar.status !== "IMPORTED" || !webinar.videoR2Key) {
    return { outcome: "no-video" as const };
  }
  assertTranscriptionConfigured();
  const now = new Date();
  const claimed = await updateSubtitleVersion(webinarId, versionId, (version) =>
    version.kind === "RU_AI" &&
    !version.revisions.length &&
    (version.status === "FAILED" || isSubtitleJobStale(version, now))
      ? withSubtitleJob(version, transcriptionJob(now), now)
      : null,
  );
  if (claimed.outcome !== "saved") return { outcome: "not-retryable" as const };
  const videoKey = webinar.videoR2Key;
  runSubtitleJob(versionId, () =>
    submitAndPollTranscription(webinarId, versionId, videoKey),
  );
  return { outcome: "started" as const, versionId };
}
