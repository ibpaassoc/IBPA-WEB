import { randomUUID } from "node:crypto";
import { requireDb } from "@/lib/db";
import type { CoreWebinar } from "@/lib/schema";
import { getTextFromR2, headR2Object } from "./r2-storage";
import {
  compareAndSetSubtitleState,
  findWebinarById,
} from "./webinar.repository";
import {
  appendSubtitleRevision,
  buildLegacySubtitleState,
  createSubtitleVersion,
  emptySubtitleState,
  isInitializedSubtitleState,
  legacySubtitleKey,
  normalizeSubtitleState,
  replaceSubtitleVersion,
  type LegacyTrackObject,
  type WebinarSubtitleState,
} from "./webinar-subtitle-state";
import { parseWebinarVtt } from "./webinar-vtt";

const LEGACY_LANGUAGES = ["ru", "en", "uk"] as const;
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
