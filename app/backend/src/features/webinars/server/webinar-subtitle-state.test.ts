import assert from "node:assert/strict";
import test from "node:test";
import {
  appendSubtitleRevision,
  buildLegacySubtitleState,
  createSubtitleVersion,
  emptySubtitleState,
  getCurrentRevision,
  isInitializedSubtitleState,
  isSubtitleJobStale,
  legacySubtitleKey,
  normalizeSubtitleState,
  subtitleRevisionKey,
  withSubtitleJob,
  withSubtitleJobFailure,
  withSubtitleJobHeartbeat,
  type LegacyTrackObject,
} from "./webinar-subtitle-state";

const now = new Date("2026-09-14T10:00:00.000Z");

function track(language: string, extra: Partial<LegacyTrackObject> = {}): LegacyTrackObject {
  return {
    storageKey: legacySubtitleKey("webinar-1", language),
    etag: `etag-${language}`,
    lastModified: "2026-09-10T08:00:00.000Z",
    metadata: {},
    cueCount: 12,
    byteSize: 900,
    ...extra,
  };
}

test("an untouched column normalizes to an uninitialized empty state", () => {
  assert.equal(isInitializedSubtitleState({}), false);
  assert.deepEqual(normalizeSubtitleState({}), emptySubtitleState());
  assert.deepEqual(normalizeSubtitleState(null), emptySubtitleState());
});

test("legacy Zoom ru.vtt becomes the active SOURCE version pointing at the original object", () => {
  const state = buildLegacySubtitleState({
    webinarId: "webinar-1",
    now,
    zoomTranscriptImported: true,
    tracks: { ru: track("ru") },
  });

  assert.equal(state.versions.length, 1);
  const [source] = state.versions;
  assert.equal(source.kind, "SOURCE");
  assert.equal(source.language, "ru");
  assert.equal(source.origin.type, "ZOOM_IMPORT");
  assert.equal(state.activeVersionIds.ru, source.id);
  assert.equal(state.activeVersionIds.en, null);

  const revision = getCurrentRevision(source);
  assert.equal(revision?.storageKey, "webinars/webinar-1/subtitles/ru.vtt");
  assert.equal(revision?.number, 1);
  assert.equal(revision?.cueCount, 12);
  assert.equal(state.legacyTracks[0].registeredVersionId, source.id);
});

test("legacy English test copies are preserved but never auto-selected for members", () => {
  const state = buildLegacySubtitleState({
    webinarId: "webinar-1",
    now,
    zoomTranscriptImported: true,
    tracks: {
      ru: track("ru"),
      en: track("en", { metadata: { source: "ru", translation: "test-copy" } }),
      uk: track("uk"),
    },
  });

  const english = state.versions.find((version) => version.language === "en");
  const source = state.versions.find((version) => version.kind === "SOURCE");
  assert.equal(english?.kind, "EN_MANUAL");
  assert.equal(english?.origin.sourceVersionId, source?.id);
  assert.equal(english?.origin.sourceKind, "SOURCE");
  assert.equal(state.activeVersionIds.en, null);

  const ukrainian = state.legacyTracks.find((item) => item.language === "uk");
  assert.equal(ukrainian?.storageKey, "webinars/webinar-1/subtitles/uk.vtt");
  assert.equal(ukrainian?.registeredVersionId, null);
});

test("webinars without subtitles migrate to an empty registry", () => {
  const state = buildLegacySubtitleState({
    webinarId: "webinar-2",
    now,
    zoomTranscriptImported: false,
    tracks: {},
  });
  assert.equal(state.versions.length, 0);
  assert.equal(isInitializedSubtitleState(state), true);
  assert.equal(state.migratedAt, now.toISOString());
});

test("revisions append with increasing numbers and never replace history", () => {
  let version = createSubtitleVersion({
    kind: "RU_MANUAL",
    origin: { type: "MANUAL_EDIT", sourceKind: "RU_AI", sourceVersionId: "ai" },
    status: "READY",
    createdBy: "admin@ibpassociations.org",
    now,
  });
  for (const id of ["r1", "r2", "r3"]) {
    version = appendSubtitleRevision(version, {
      id,
      kind: id === "r1" ? "BASELINE" : "EDIT",
      storageKey: subtitleRevisionKey("webinar-1", version.id, id),
      etag: null,
      cueCount: 3,
      byteSize: 100,
      note: id,
      restoredFromRevisionId: null,
      createdBy: null,
      now,
    });
  }
  assert.deepEqual(
    version.revisions.map((revision) => [revision.id, revision.number]),
    [
      ["r1", 1],
      ["r2", 2],
      ["r3", 3],
    ],
  );
  assert.equal(version.currentRevisionId, "r3");
  assert.equal(version.origin.sourceKind, "RU_AI");
});

test("normalization drops malformed entries and dangling active selections", () => {
  const state = normalizeSubtitleState({
    schemaVersion: 1,
    stateVersion: 4,
    versions: [
      { id: "ok", kind: "EN_AI", status: "READY", revisions: [{ id: "a", storageKey: "k" }] },
      { id: "bad-kind", kind: "FR_AI" },
      { kind: "RU_AI" },
    ],
    activeVersionIds: { ru: "ok", en: "ok" },
  });
  assert.equal(state.stateVersion, 4);
  assert.deepEqual(state.versions.map((version) => version.id), ["ok"]);
  assert.equal(state.versions[0].language, "en");
  assert.equal(state.versions[0].currentRevisionId, "a");
  // An English version cannot be the active Russian track.
  assert.equal(state.activeVersionIds.ru, null);
  assert.equal(state.activeVersionIds.en, "ok");
});

test("stale AI jobs are detected from their heartbeat", () => {
  const started = new Date("2026-09-14T10:00:00.000Z");
  const version = withSubtitleJob(
    createSubtitleVersion({
      kind: "RU_AI",
      origin: { type: "AI_TRANSCRIPTION", provider: "assemblyai" },
      status: "PROCESSING",
      createdBy: null,
      now: started,
    }),
    {
      type: "TRANSCRIPTION",
      provider: "assemblyai",
      providerJobId: null,
      startedAt: started.toISOString(),
      heartbeatAt: started.toISOString(),
      progress: null,
    },
    started,
  );
  assert.equal(isSubtitleJobStale(version, new Date("2026-09-14T10:04:00.000Z")), false);
  assert.equal(isSubtitleJobStale(version, new Date("2026-09-14T10:06:00.000Z")), true);

  const beat = withSubtitleJobHeartbeat(version, new Date("2026-09-14T10:05:30.000Z"), {
    providerJobId: "job-1",
  });
  assert.equal(beat.job?.providerJobId, "job-1");
  assert.equal(isSubtitleJobStale(beat, new Date("2026-09-14T10:06:00.000Z")), false);
});

test("a failed AI job without output is FAILED; one with earlier revisions stays READY", () => {
  const created = createSubtitleVersion({
    kind: "RU_AI",
    origin: { type: "AI_TRANSCRIPTION" },
    status: "PROCESSING",
    createdBy: null,
    now,
  });
  const failed = withSubtitleJobFailure(created, "Provider error", now);
  assert.equal(failed.status, "FAILED");
  assert.equal(failed.error, "Provider error");
  assert.equal(failed.job, null);

  const withRevision = appendSubtitleRevision(created, {
    id: "r1",
    kind: "INITIAL",
    storageKey: "k",
    etag: null,
    cueCount: 1,
    byteSize: 10,
    note: "",
    restoredFromRevisionId: null,
    createdBy: null,
    now,
  });
  assert.equal(withSubtitleJobFailure(withRevision, "later failure", now).status, "READY");
});
