import { randomUUID } from "node:crypto";

/**
 * Subtitle versions live inside `ibpa.webinars.subtitle_versions` (JSONB).
 *
 * The record keeps the registry: every version, its lineage, its revision
 * history, and which version each language shows to members. Cue text stays
 * in R2 as immutable revision objects, so a revision is never overwritten and
 * restoring an earlier state only appends a new revision that points at it.
 */

export const SUBTITLE_STATE_SCHEMA_VERSION = 1;

export const subtitleVersionKinds = [
  "SOURCE",
  "RU_AI",
  "RU_MANUAL",
  "EN_AI",
  "EN_MANUAL",
] as const;
export type SubtitleVersionKind = (typeof subtitleVersionKinds)[number];

export const subtitleTrackLanguages = ["ru", "en"] as const;
export type SubtitleTrackLanguage = (typeof subtitleTrackLanguages)[number];

export const subtitleVersionStatuses = ["READY", "PROCESSING", "FAILED"] as const;
export type SubtitleVersionStatus = (typeof subtitleVersionStatuses)[number];

export const subtitleOriginTypes = [
  "ZOOM_IMPORT",
  "AI_TRANSCRIPTION",
  "AI_TRANSLATION",
  "MANUAL_EDIT",
  "LEGACY_TRACK",
] as const;
export type SubtitleOriginType = (typeof subtitleOriginTypes)[number];

export const subtitleRevisionKinds = [
  "INITIAL",
  "BASELINE",
  "EDIT",
  "RESTORE",
] as const;
export type SubtitleRevisionKind = (typeof subtitleRevisionKinds)[number];

export const KIND_LANGUAGE: Record<SubtitleVersionKind, SubtitleTrackLanguage> = {
  SOURCE: "ru",
  RU_AI: "ru",
  RU_MANUAL: "ru",
  EN_AI: "en",
  EN_MANUAL: "en",
};

export type SubtitleOrigin = {
  type: SubtitleOriginType;
  sourceVersionId: string | null;
  sourceRevisionId: string | null;
  sourceKind: SubtitleVersionKind | null;
  provider: string | null;
  model: string | null;
};

export type SubtitleRevision = {
  id: string;
  number: number;
  kind: SubtitleRevisionKind;
  storageKey: string;
  etag: string | null;
  cueCount: number;
  byteSize: number;
  note: string;
  restoredFromRevisionId: string | null;
  createdAt: string;
  createdBy: string | null;
};

export type SubtitleJob = {
  type: "TRANSCRIPTION" | "TRANSLATION";
  provider: string;
  providerJobId: string | null;
  startedAt: string;
  heartbeatAt: string;
  progress: { completed: number; total: number } | null;
};

export type SubtitleVersion = {
  id: string;
  kind: SubtitleVersionKind;
  language: SubtitleTrackLanguage;
  status: SubtitleVersionStatus;
  error: string | null;
  origin: SubtitleOrigin;
  currentRevisionId: string | null;
  revisions: SubtitleRevision[];
  job: SubtitleJob | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
};

export type LegacySubtitleTrack = {
  language: string;
  storageKey: string;
  etag: string | null;
  lastModified: string | null;
  registeredVersionId: string | null;
};

export type WebinarSubtitleState = {
  schemaVersion: typeof SUBTITLE_STATE_SCHEMA_VERSION;
  /** Compare-and-set counter; every write increments it. */
  stateVersion: number;
  versions: SubtitleVersion[];
  activeVersionIds: Record<SubtitleTrackLanguage, string | null>;
  legacyTracks: LegacySubtitleTrack[];
  migratedAt: string | null;
};

export function isManualKind(kind: SubtitleVersionKind) {
  return kind === "RU_MANUAL" || kind === "EN_MANUAL";
}

export function manualKindFor(language: SubtitleTrackLanguage): SubtitleVersionKind {
  return language === "en" ? "EN_MANUAL" : "RU_MANUAL";
}

export function isSubtitleVersionKind(value: unknown): value is SubtitleVersionKind {
  return subtitleVersionKinds.includes(value as SubtitleVersionKind);
}

export function isSubtitleTrackLanguage(
  value: unknown,
): value is SubtitleTrackLanguage {
  return subtitleTrackLanguages.includes(value as SubtitleTrackLanguage);
}

export function subtitleRevisionKey(
  webinarId: string,
  versionId: string,
  revisionId: string,
) {
  return `webinars/${webinarId}/subtitles/versions/${versionId}/${revisionId}.vtt`;
}

/** The deterministic key the Zoom import (and the pre-versioning editor) used. */
export function legacySubtitleKey(webinarId: string, language: string) {
  return `webinars/${webinarId}/subtitles/${language}.vtt`;
}

export function emptySubtitleState(): WebinarSubtitleState {
  return {
    schemaVersion: SUBTITLE_STATE_SCHEMA_VERSION,
    stateVersion: 0,
    versions: [],
    activeVersionIds: { ru: null, en: null },
    legacyTracks: [],
    migratedAt: null,
  };
}

export function isInitializedSubtitleState(raw: unknown) {
  return (
    Boolean(raw) &&
    typeof raw === "object" &&
    (raw as { schemaVersion?: unknown }).schemaVersion ===
      SUBTITLE_STATE_SCHEMA_VERSION
  );
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function nullableText(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function count(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? Math.floor(numeric) : 0;
}

function normalizeOrigin(raw: unknown): SubtitleOrigin {
  const value = record(raw) || {};
  return {
    type: subtitleOriginTypes.includes(value.type as SubtitleOriginType)
      ? (value.type as SubtitleOriginType)
      : "LEGACY_TRACK",
    sourceVersionId: nullableText(value.sourceVersionId),
    sourceRevisionId: nullableText(value.sourceRevisionId),
    sourceKind: isSubtitleVersionKind(value.sourceKind) ? value.sourceKind : null,
    provider: nullableText(value.provider),
    model: nullableText(value.model),
  };
}

function normalizeRevision(raw: unknown): SubtitleRevision | null {
  const value = record(raw);
  if (!value || !text(value.id) || !text(value.storageKey)) return null;
  return {
    id: text(value.id),
    number: Math.max(1, count(value.number)),
    kind: subtitleRevisionKinds.includes(value.kind as SubtitleRevisionKind)
      ? (value.kind as SubtitleRevisionKind)
      : "EDIT",
    storageKey: text(value.storageKey),
    etag: nullableText(value.etag),
    cueCount: count(value.cueCount),
    byteSize: count(value.byteSize),
    note: text(value.note),
    restoredFromRevisionId: nullableText(value.restoredFromRevisionId),
    createdAt: text(value.createdAt, new Date(0).toISOString()),
    createdBy: nullableText(value.createdBy),
  };
}

function normalizeJob(raw: unknown): SubtitleJob | null {
  const value = record(raw);
  if (!value) return null;
  const type = value.type === "TRANSLATION" ? "TRANSLATION" : "TRANSCRIPTION";
  const progress = record(value.progress);
  return {
    type,
    provider: text(value.provider, "unknown"),
    providerJobId: nullableText(value.providerJobId),
    startedAt: text(value.startedAt, new Date(0).toISOString()),
    heartbeatAt: text(value.heartbeatAt, text(value.startedAt)),
    progress: progress
      ? { completed: count(progress.completed), total: count(progress.total) }
      : null,
  };
}

function normalizeVersion(raw: unknown): SubtitleVersion | null {
  const value = record(raw);
  if (!value || !text(value.id) || !isSubtitleVersionKind(value.kind)) {
    return null;
  }
  const revisions = Array.isArray(value.revisions)
    ? value.revisions
        .map(normalizeRevision)
        .filter((revision): revision is SubtitleRevision => Boolean(revision))
    : [];
  const currentRevisionId = nullableText(value.currentRevisionId);
  return {
    id: text(value.id),
    kind: value.kind,
    language: KIND_LANGUAGE[value.kind],
    status: subtitleVersionStatuses.includes(value.status as SubtitleVersionStatus)
      ? (value.status as SubtitleVersionStatus)
      : revisions.length
        ? "READY"
        : "FAILED",
    error: nullableText(value.error),
    origin: normalizeOrigin(value.origin),
    currentRevisionId:
      currentRevisionId &&
      revisions.some((revision) => revision.id === currentRevisionId)
        ? currentRevisionId
        : revisions.at(-1)?.id || null,
    revisions,
    job: normalizeJob(value.job),
    createdAt: text(value.createdAt, new Date(0).toISOString()),
    createdBy: nullableText(value.createdBy),
    updatedAt: text(value.updatedAt, text(value.createdAt)),
  };
}

/** Defensive read of the JSONB column; unknown or malformed entries are dropped. */
export function normalizeSubtitleState(raw: unknown): WebinarSubtitleState {
  const value = record(raw);
  if (!value || !isInitializedSubtitleState(value)) return emptySubtitleState();

  const versions = Array.isArray(value.versions)
    ? value.versions
        .map(normalizeVersion)
        .filter((version): version is SubtitleVersion => Boolean(version))
    : [];
  const active = record(value.activeVersionIds) || {};
  const activeFor = (language: SubtitleTrackLanguage) => {
    const id = nullableText(active[language]);
    return id &&
      versions.some((version) => version.id === id && version.language === language)
      ? id
      : null;
  };

  return {
    schemaVersion: SUBTITLE_STATE_SCHEMA_VERSION,
    stateVersion: count(value.stateVersion),
    versions,
    activeVersionIds: { ru: activeFor("ru"), en: activeFor("en") },
    legacyTracks: Array.isArray(value.legacyTracks)
      ? value.legacyTracks
          .map((item) => record(item))
          .filter((item): item is Record<string, unknown> =>
            Boolean(item && text(item.storageKey)),
          )
          .map((item) => ({
            language: text(item.language),
            storageKey: text(item.storageKey),
            etag: nullableText(item.etag),
            lastModified: nullableText(item.lastModified),
            registeredVersionId: nullableText(item.registeredVersionId),
          }))
      : [],
    migratedAt: nullableText(value.migratedAt),
  };
}

export function findSubtitleVersion(
  state: WebinarSubtitleState,
  versionId: string,
) {
  return state.versions.find((version) => version.id === versionId) || null;
}

export function getCurrentRevision(version: SubtitleVersion) {
  return (
    version.revisions.find(
      (revision) => revision.id === version.currentRevisionId,
    ) || null
  );
}

export function createSubtitleVersion(input: {
  kind: SubtitleVersionKind;
  origin: Partial<SubtitleOrigin> & { type: SubtitleOriginType };
  status: SubtitleVersionStatus;
  createdBy: string | null;
  now: Date;
  id?: string;
}): SubtitleVersion {
  const timestamp = input.now.toISOString();
  return {
    id: input.id || randomUUID(),
    kind: input.kind,
    language: KIND_LANGUAGE[input.kind],
    status: input.status,
    error: null,
    origin: {
      type: input.origin.type,
      sourceVersionId: input.origin.sourceVersionId ?? null,
      sourceRevisionId: input.origin.sourceRevisionId ?? null,
      sourceKind: input.origin.sourceKind ?? null,
      provider: input.origin.provider ?? null,
      model: input.origin.model ?? null,
    },
    currentRevisionId: null,
    revisions: [],
    job: null,
    createdAt: timestamp,
    createdBy: input.createdBy,
    updatedAt: timestamp,
  };
}

/** Returns a copy of the version with a new current revision appended. */
export function appendSubtitleRevision(
  version: SubtitleVersion,
  input: Omit<SubtitleRevision, "number" | "createdAt"> & { now: Date },
): SubtitleVersion {
  const { now, ...revision } = input;
  const timestamp = now.toISOString();
  const number =
    version.revisions.reduce((max, item) => Math.max(max, item.number), 0) + 1;
  return {
    ...version,
    status: "READY",
    error: null,
    job: null,
    currentRevisionId: revision.id,
    revisions: [
      ...version.revisions,
      { ...revision, number, createdAt: timestamp },
    ],
    updatedAt: timestamp,
  };
}

export function replaceSubtitleVersion(
  state: WebinarSubtitleState,
  version: SubtitleVersion,
): WebinarSubtitleState {
  const exists = state.versions.some((item) => item.id === version.id);
  return {
    ...state,
    versions: exists
      ? state.versions.map((item) => (item.id === version.id ? version : item))
      : [...state.versions, version],
  };
}

/**
 * English translations may start from any ready Russian-language version
 * (Zoom SOURCE, AI Russian, or a manual Russian correction); the admin picks.
 */
export function isEnglishTranslationSource(version: SubtitleVersion) {
  return (
    version.language === "ru" &&
    version.status === "READY" &&
    Boolean(getCurrentRevision(version))
  );
}

/** Background jobs refresh `heartbeatAt`; a silent job is treated as interrupted. */
export const SUBTITLE_JOB_STALE_MS = 5 * 60 * 1000;

export function isSubtitleJobStale(version: SubtitleVersion, now: Date) {
  if (version.status !== "PROCESSING" || !version.job) return false;
  const heartbeat = new Date(version.job.heartbeatAt || version.job.startedAt);
  return (
    Number.isNaN(heartbeat.getTime()) ||
    now.getTime() - heartbeat.getTime() > SUBTITLE_JOB_STALE_MS
  );
}

export function withSubtitleJob(
  version: SubtitleVersion,
  job: SubtitleJob,
  now: Date,
): SubtitleVersion {
  return {
    ...version,
    status: "PROCESSING",
    error: null,
    job,
    updatedAt: now.toISOString(),
  };
}

export function withSubtitleJobHeartbeat(
  version: SubtitleVersion,
  now: Date,
  patch: Partial<Pick<SubtitleJob, "providerJobId" | "progress">> = {},
): SubtitleVersion {
  if (version.status !== "PROCESSING" || !version.job) return version;
  return {
    ...version,
    job: { ...version.job, ...patch, heartbeatAt: now.toISOString() },
  };
}

export function withSubtitleJobFailure(
  version: SubtitleVersion,
  message: string,
  now: Date,
): SubtitleVersion {
  return {
    ...version,
    // A version that already has revisions keeps serving its last good state.
    status: version.revisions.length ? "READY" : "FAILED",
    error: message.slice(0, 500),
    job: null,
    updatedAt: now.toISOString(),
  };
}

export type LegacyTrackObject = {
  storageKey: string;
  etag: string | null;
  lastModified: string | null;
  metadata: Record<string, string>;
  cueCount: number;
  byteSize: number;
};

/**
 * Registers the pre-versioning R2 tracks as versions without moving or
 * rewriting any object:
 * - `ru.vtt` becomes the SOURCE version (the Zoom transcript).
 * - `en.vtt` becomes an English manual version derived from SOURCE. The old
 *   "test-copy" tracks contain Russian text, so they are preserved but never
 *   selected for members automatically.
 * - Any other language is kept in `legacyTracks` untouched.
 */
export function buildLegacySubtitleState(input: {
  webinarId: string;
  now: Date;
  zoomTranscriptImported: boolean;
  tracks: Partial<Record<string, LegacyTrackObject>>;
}): WebinarSubtitleState {
  const state = emptySubtitleState();
  state.migratedAt = input.now.toISOString();
  const trackDate = (track: LegacyTrackObject) => {
    const parsed = track.lastModified ? new Date(track.lastModified) : null;
    return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
  };

  const russian = input.tracks.ru;
  let sourceVersion: SubtitleVersion | null = null;
  if (russian) {
    const created = createSubtitleVersion({
      kind: "SOURCE",
      origin: {
        type: input.zoomTranscriptImported ? "ZOOM_IMPORT" : "LEGACY_TRACK",
        provider: "zoom",
      },
      status: "READY",
      createdBy: null,
      now: trackDate(russian) ?? input.now,
    });
    sourceVersion = appendSubtitleRevision(created, {
      id: randomUUID(),
      kind: "INITIAL",
      storageKey: russian.storageKey,
      etag: russian.etag,
      cueCount: russian.cueCount,
      byteSize: russian.byteSize,
      note: "Original Zoom transcript",
      restoredFromRevisionId: null,
      createdBy: null,
      now: trackDate(russian) ?? input.now,
    });
    state.versions.push(sourceVersion);
    state.activeVersionIds.ru = sourceVersion.id;
  }

  const english = input.tracks.en;
  if (english) {
    const isTestCopy = english.metadata.translation === "test-copy";
    const created = createSubtitleVersion({
      kind: "EN_MANUAL",
      origin: {
        type: "LEGACY_TRACK",
        sourceVersionId: isTestCopy ? sourceVersion?.id ?? null : null,
        sourceRevisionId: isTestCopy ? sourceVersion?.currentRevisionId ?? null : null,
        sourceKind: isTestCopy && sourceVersion ? "SOURCE" : null,
      },
      status: "READY",
      createdBy: null,
      now: trackDate(english) ?? input.now,
    });
    const englishVersion = appendSubtitleRevision(created, {
      id: randomUUID(),
      kind: "INITIAL",
      storageKey: english.storageKey,
      etag: english.etag,
      cueCount: english.cueCount,
      byteSize: english.byteSize,
      note: isTestCopy
        ? "Legacy English test copy (contains the original Russian text)"
        : "Legacy English track",
      restoredFromRevisionId: null,
      createdBy: null,
      now: trackDate(english) ?? input.now,
    });
    state.versions.push(englishVersion);
    if (!isTestCopy) state.activeVersionIds.en = englishVersion.id;
  }

  for (const [language, track] of Object.entries(input.tracks)) {
    if (!track) continue;
    const registered = state.versions.find(
      (version) => version.revisions[0]?.storageKey === track.storageKey,
    );
    state.legacyTracks.push({
      language,
      storageKey: track.storageKey,
      etag: track.etag,
      lastModified: track.lastModified,
      registeredVersionId: registered?.id ?? null,
    });
  }

  return state;
}

export type StoredRevisionObject = {
  storageKey: string;
  etag: string | null;
  cueCount: number;
  byteSize: number;
};

export type ManualSavePlan =
  | { outcome: "not-found" }
  | { outcome: "not-editable" }
  | { outcome: "conflict"; currentRevisionId: string | null }
  | {
      outcome: "saved";
      state: WebinarSubtitleState;
      versionId: string;
      revisionId: string;
      createdVersion: boolean;
    };

/**
 * Manual edits never overwrite a version:
 * - Editing a manual version appends an EDIT revision (optimistic concurrency
 *   on the revision the editor opened).
 * - Editing SOURCE or an AI version creates a new manual version whose first
 *   revision is a BASELINE pointing at the untouched original, followed by the
 *   admin's EDIT. Restoring revision 1 therefore returns to the original text.
 */
export function planManualSave(
  state: WebinarSubtitleState,
  input: {
    versionId: string;
    expectedRevisionId: string | null;
    object: StoredRevisionObject;
    revisionId: string;
    manualVersionId: string;
    baselineRevisionId: string;
    actor: string | null;
    now: Date;
  },
): ManualSavePlan {
  const base = findSubtitleVersion(state, input.versionId);
  if (!base) return { outcome: "not-found" };
  const current = getCurrentRevision(base);
  if (base.status !== "READY" || !current) return { outcome: "not-editable" };
  if (current.id !== input.expectedRevisionId) {
    return { outcome: "conflict", currentRevisionId: current.id };
  }

  const edit = {
    id: input.revisionId,
    kind: "EDIT" as const,
    ...input.object,
    note: "Manual edit",
    restoredFromRevisionId: null,
    createdBy: input.actor,
    now: input.now,
  };

  if (isManualKind(base.kind)) {
    return {
      outcome: "saved",
      state: replaceSubtitleVersion(state, appendSubtitleRevision(base, edit)),
      versionId: base.id,
      revisionId: input.revisionId,
      createdVersion: false,
    };
  }

  let manual = createSubtitleVersion({
    id: input.manualVersionId,
    kind: manualKindFor(base.language),
    origin: {
      type: "MANUAL_EDIT",
      sourceVersionId: base.id,
      sourceRevisionId: current.id,
      sourceKind: base.kind,
    },
    status: "READY",
    createdBy: input.actor,
    now: input.now,
  });
  manual = appendSubtitleRevision(manual, {
    id: input.baselineRevisionId,
    kind: "BASELINE",
    storageKey: current.storageKey,
    etag: current.etag,
    cueCount: current.cueCount,
    byteSize: current.byteSize,
    note: "Starting point before manual corrections",
    restoredFromRevisionId: current.id,
    createdBy: input.actor,
    now: input.now,
  });
  manual = appendSubtitleRevision(manual, edit);

  return {
    outcome: "saved",
    state: replaceSubtitleVersion(state, manual),
    versionId: manual.id,
    revisionId: input.revisionId,
    createdVersion: true,
  };
}

export type RestorePlan =
  | { outcome: "not-found" }
  | { outcome: "not-restorable" }
  | { outcome: "conflict"; currentRevisionId: string | null }
  | { outcome: "saved"; state: WebinarSubtitleState; revisionId: string };

/** Restore appends a RESTORE revision that reuses the earlier revision's object. */
export function planRevisionRestore(
  state: WebinarSubtitleState,
  input: {
    versionId: string;
    revisionId: string;
    expectedRevisionId: string | null;
    newRevisionId: string;
    actor: string | null;
    now: Date;
  },
): RestorePlan {
  const version = findSubtitleVersion(state, input.versionId);
  if (!version) return { outcome: "not-found" };
  const target = version.revisions.find((item) => item.id === input.revisionId);
  if (!target) return { outcome: "not-found" };
  if (!isManualKind(version.kind) || version.status !== "READY") {
    return { outcome: "not-restorable" };
  }
  if (version.currentRevisionId !== input.expectedRevisionId) {
    return { outcome: "conflict", currentRevisionId: version.currentRevisionId };
  }
  if (target.id === version.currentRevisionId) return { outcome: "not-restorable" };

  const restored = appendSubtitleRevision(version, {
    id: input.newRevisionId,
    kind: "RESTORE",
    storageKey: target.storageKey,
    etag: target.etag,
    cueCount: target.cueCount,
    byteSize: target.byteSize,
    note: `Restored revision ${target.number}`,
    restoredFromRevisionId: target.id,
    createdBy: input.actor,
    now: input.now,
  });
  return {
    outcome: "saved",
    state: replaceSubtitleVersion(state, restored),
    revisionId: input.newRevisionId,
  };
}

export type ActiveTrackPlan =
  | { outcome: "invalid" }
  | { outcome: "saved"; state: WebinarSubtitleState };

/** Chooses the version members see for a language; null hides that language. */
export function planActiveVersion(
  state: WebinarSubtitleState,
  language: SubtitleTrackLanguage,
  versionId: string | null,
): ActiveTrackPlan {
  if (versionId !== null) {
    const version = findSubtitleVersion(state, versionId);
    if (
      !version ||
      version.language !== language ||
      version.status !== "READY" ||
      !getCurrentRevision(version)
    ) {
      return { outcome: "invalid" };
    }
  }
  return {
    outcome: "saved",
    state: {
      ...state,
      activeVersionIds: { ...state.activeVersionIds, [language]: versionId },
    },
  };
}
