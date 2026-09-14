import { randomUUID } from "node:crypto";
import { requireDb } from "@/lib/db";
import type { CoreWebinar } from "@/lib/schema";
import { getTextFromR2, headR2Object, putTextToR2 } from "./r2-storage";
import {
  compareAndSetSubtitleState,
  findWebinarById,
} from "./webinar.repository";
import {
  appendSubtitleRevision,
  buildLegacySubtitleState,
  createSubtitleVersion,
  emptySubtitleState,
  findSubtitleVersion,
  getCurrentRevision,
  isInitializedSubtitleState,
  legacySubtitleKey,
  normalizeSubtitleState,
  planActiveVersion,
  planManualSave,
  planRevisionRestore,
  replaceSubtitleVersion,
  subtitleRevisionKey,
  type LegacyTrackObject,
  type ManualSavePlan,
  type RestorePlan,
  type SubtitleTrackLanguage,
  type WebinarSubtitleState,
} from "./webinar-subtitle-state";
import { parseWebinarVtt } from "./webinar-vtt";

const LEGACY_LANGUAGES = ["ru", "en", "uk"] as const;
const MAX_VTT_BYTES = 4 * 1024 * 1024;
const MAX_STATE_WRITE_ATTEMPTS = 6;

type DbClient = ReturnType<typeof requireDb>;

export function countVttCues(source: string) {
  try {
    return parseWebinarVtt(source).length;
  } catch {
    return 0;
  }
}

async function readLegacyTrack(
  webinarId: string,
  language: string,
): Promise<LegacyTrackObject | null> {
  const storageKey = legacySubtitleKey(webinarId, language);
  const head = await headR2Object(storageKey);
  if (!head) return null;
  const object = await getTextFromR2(storageKey);
  if (!object) return null;
  return {
    storageKey,
    etag: head.etag,
    lastModified: head.lastModified,
    metadata: head.metadata,
    cueCount: countVttCues(object.text),
    byteSize: Buffer.byteLength(object.text, "utf8"),
  };
}

/**
 * Returns the webinar's subtitle registry, registering pre-versioning R2
 * tracks on first access. Nothing in R2 is moved, copied, or rewritten.
 */
export async function ensureWebinarSubtitleState(
  webinar: CoreWebinar,
  db: DbClient = requireDb(),
): Promise<{ webinar: CoreWebinar; state: WebinarSubtitleState }> {
  if (isInitializedSubtitleState(webinar.subtitleVersions)) {
    return { webinar, state: normalizeSubtitleState(webinar.subtitleVersions) };
  }
  // An import in flight registers its own SOURCE version when it finishes.
  if (webinar.status === "IMPORTING") {
    return { webinar, state: emptySubtitleState() };
  }

  const tracks: Record<string, LegacyTrackObject> = {};
  for (const language of LEGACY_LANGUAGES) {
    const track = await readLegacyTrack(webinar.id, language);
    if (track) tracks[language] = track;
  }

  const migrated = buildLegacySubtitleState({
    webinarId: webinar.id,
    now: new Date(),
    zoomTranscriptImported: webinar.transcriptStatus === "IMPORTED",
    tracks,
  });
  migrated.stateVersion = 1;

  const updated = await compareAndSetSubtitleState(db, {
    id: webinar.id,
    expectedStateVersion: 0,
    state: migrated,
  });
  if (updated) return { webinar: updated, state: migrated };

  // Another request migrated first; use its result.
  const current = await findWebinarById(db, webinar.id);
  return {
    webinar: current || webinar,
    state: normalizeSubtitleState(current?.subtitleVersions),
  };
}

export type SubtitleMutation<T> =
  | { state: WebinarSubtitleState; result: T }
  | { abort: T };

/**
 * Read → mutate → compare-and-set, retried on concurrent writes. Mutators must
 * be pure over the state they receive; generate ids and write R2 objects
 * before calling so a retry reuses them.
 */
export async function mutateWebinarSubtitleState<T>(
  webinarId: string,
  mutate: (context: {
    webinar: CoreWebinar;
    state: WebinarSubtitleState;
  }) => SubtitleMutation<T>,
): Promise<
  | { outcome: "not-found" }
  | { outcome: "aborted"; result: T }
  | { outcome: "saved"; result: T; state: WebinarSubtitleState; webinar: CoreWebinar }
> {
  const db = requireDb();
  for (let attempt = 0; attempt < MAX_STATE_WRITE_ATTEMPTS; attempt += 1) {
    const record = await findWebinarById(db, webinarId);
    if (!record) return { outcome: "not-found" };
    const { webinar, state } = await ensureWebinarSubtitleState(record, db);
    const mutation = mutate({ webinar, state });
    if ("abort" in mutation) return { outcome: "aborted", result: mutation.abort };

    const next: WebinarSubtitleState = {
      ...mutation.state,
      stateVersion: state.stateVersion + 1,
    };
    const updated = await compareAndSetSubtitleState(db, {
      id: webinarId,
      expectedStateVersion: state.stateVersion,
      state: next,
    });
    if (updated) {
      return { outcome: "saved", result: mutation.result, state: next, webinar: updated };
    }
  }

  const error = new Error(
    "Subtitles changed while saving. Reload the webinar and try again.",
  );
  Object.assign(error, { code: "VERSION_CONFLICT" });
  throw error;
}

/** Registers the Zoom transcript written by the import as the SOURCE version. */
export async function registerImportedSourceSubtitles(input: {
  webinarId: string;
  storageKey: string;
  zoomRecordingFileId: string;
}) {
  const object = await getTextFromR2(input.storageKey);
  if (!object) return null;
  const versionId = randomUUID();
  const revisionId = randomUUID();
  const now = new Date();

  return mutateWebinarSubtitleState(input.webinarId, ({ state }) => {
    const alreadyRegistered = state.versions.some((version) =>
      version.revisions.some(
        (revision) => revision.storageKey === input.storageKey,
      ),
    );
    if (alreadyRegistered) return { abort: null };

    const version = appendSubtitleRevision(
      createSubtitleVersion({
        id: versionId,
        kind: "SOURCE",
        origin: { type: "ZOOM_IMPORT", provider: "zoom" },
        status: "READY",
        createdBy: null,
        now,
      }),
      {
        id: revisionId,
        kind: "INITIAL",
        storageKey: input.storageKey,
        etag: object.etag,
        cueCount: countVttCues(object.text),
        byteSize: Buffer.byteLength(object.text, "utf8"),
        note: `Original Zoom transcript (recording file ${input.zoomRecordingFileId})`,
        restoredFromRevisionId: null,
        createdBy: null,
        now,
      },
    );
    const next = replaceSubtitleVersion(state, version);
    return {
      state: {
        ...next,
        activeVersionIds: {
          ...next.activeVersionIds,
          ru: next.activeVersionIds.ru ?? version.id,
        },
      },
      result: version.id,
    };
  });
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

function versionConflict(message: string) {
  const error = new Error(message);
  Object.assign(error, { code: "VERSION_CONFLICT" });
  return error;
}

export async function getSubtitleVersionContent(input: {
  webinarId: string;
  versionId: string;
  revisionId?: string | null;
}) {
  const record = await findWebinarById(requireDb(), input.webinarId);
  if (!record) return { outcome: "not-found" as const };
  const { state } = await ensureWebinarSubtitleState(record);
  const version = findSubtitleVersion(state, input.versionId);
  const revision = version
    ? input.revisionId
      ? version.revisions.find((item) => item.id === input.revisionId) || null
      : getCurrentRevision(version)
    : null;
  if (!version || !revision) return { outcome: "missing" as const };
  const object = await getTextFromR2(revision.storageKey);
  if (!object) return { outcome: "missing" as const };
  return {
    outcome: "ok" as const,
    versionId: version.id,
    revisionId: revision.id,
    etag: object.etag,
    text: object.text,
  };
}

/**
 * Saves the editor's cues. Editing SOURCE or an AI version creates a manual
 * version; editing a manual version appends a revision. The original version
 * is never modified.
 */
export async function saveManualSubtitleRevision(input: {
  webinarId: string;
  versionId: string;
  vtt: string;
  expectedRevisionId: string | null;
  actor: string | null;
}) {
  if (Buffer.byteLength(input.vtt, "utf8") > MAX_VTT_BYTES) {
    throw new Error("Subtitle files must be smaller than 4 MB.");
  }
  parseWebinarVtt(input.vtt);

  const record = await findWebinarById(requireDb(), input.webinarId);
  if (!record) return { outcome: "not-found" as const };
  const { state } = await ensureWebinarSubtitleState(record);
  const base = findSubtitleVersion(state, input.versionId);
  if (!base) return { outcome: "missing" as const };

  const manualVersionId = randomUUID();
  const revisionId = randomUUID();
  const baselineRevisionId = randomUUID();
  const targetVersionId =
    base.kind === "RU_MANUAL" || base.kind === "EN_MANUAL"
      ? base.id
      : manualVersionId;
  const object = await writeSubtitleRevisionObject({
    webinarId: input.webinarId,
    versionId: targetVersionId,
    revisionId,
    vtt: input.vtt,
    metadata: { kind: "MANUAL_EDIT" },
  });

  const now = new Date();
  const saved = await mutateWebinarSubtitleState<ManualSavePlan>(input.webinarId, ({ state: latest }) => {
    const plan = planManualSave(latest, {
      versionId: input.versionId,
      expectedRevisionId: input.expectedRevisionId,
      object,
      revisionId,
      manualVersionId,
      baselineRevisionId,
      actor: input.actor,
      now,
    });
    if (plan.outcome !== "saved") return { abort: plan };
    return { state: plan.state, result: plan };
  });

  if (saved.outcome === "not-found") return { outcome: "not-found" as const };
  const plan = saved.result;
  if (plan.outcome === "conflict") {
    throw versionConflict(
      "This subtitle version changed after you opened it. Reload the latest revision before saving.",
    );
  }
  if (plan.outcome === "not-found") return { outcome: "missing" as const };
  if (plan.outcome === "not-editable") return { outcome: "not-editable" as const };
  return {
    outcome: "saved" as const,
    versionId: plan.versionId,
    revisionId: plan.revisionId,
    createdVersion: plan.createdVersion,
    etag: object.etag,
  };
}

export async function restoreSubtitleRevision(input: {
  webinarId: string;
  versionId: string;
  revisionId: string;
  expectedRevisionId: string | null;
  actor: string | null;
}) {
  const newRevisionId = randomUUID();
  const now = new Date();
  const saved = await mutateWebinarSubtitleState<RestorePlan>(input.webinarId, ({ state }) => {
    const plan = planRevisionRestore(state, {
      versionId: input.versionId,
      revisionId: input.revisionId,
      expectedRevisionId: input.expectedRevisionId,
      newRevisionId,
      actor: input.actor,
      now,
    });
    if (plan.outcome !== "saved") return { abort: plan };
    return { state: plan.state, result: plan };
  });
  if (saved.outcome === "not-found") return { outcome: "not-found" as const };
  const plan = saved.result;
  if (plan.outcome === "conflict") {
    throw versionConflict(
      "This subtitle version changed after you opened it. Reload the latest revision before restoring.",
    );
  }
  if (plan.outcome === "saved") {
    return { outcome: "saved" as const, revisionId: plan.revisionId };
  }
  return { outcome: plan.outcome };
}

export async function setActiveSubtitleVersion(input: {
  webinarId: string;
  language: SubtitleTrackLanguage;
  versionId: string | null;
}) {
  const saved = await mutateWebinarSubtitleState<boolean>(input.webinarId, ({ state }) => {
    const plan = planActiveVersion(state, input.language, input.versionId);
    if (plan.outcome !== "saved") return { abort: false };
    return { state: plan.state, result: true };
  });
  if (saved.outcome === "not-found") return { outcome: "not-found" as const };
  if (saved.outcome === "aborted") return { outcome: "invalid" as const };
  return { outcome: "saved" as const, activeVersionIds: saved.state.activeVersionIds };
}
