import assert from "node:assert/strict";
import test from "node:test";
import {
  appendSubtitleRevision,
  createSubtitleVersion,
  emptySubtitleState,
  findSubtitleVersion,
  getCurrentRevision,
  planActiveVersion,
  planManualSave,
  planRevisionRestore,
  replaceSubtitleVersion,
  type SubtitleVersionKind,
  type WebinarSubtitleState,
} from "./webinar-subtitle-state";

const now = new Date("2026-09-14T12:00:00.000Z");

function withVersion(
  state: WebinarSubtitleState,
  id: string,
  kind: SubtitleVersionKind,
  revisionIds: string[] = [`${id}-r1`],
) {
  let version = createSubtitleVersion({
    id,
    kind,
    origin: { type: kind === "SOURCE" ? "ZOOM_IMPORT" : "AI_TRANSCRIPTION" },
    status: "READY",
    createdBy: null,
    now,
  });
  for (const revisionId of revisionIds) {
    version = appendSubtitleRevision(version, {
      id: revisionId,
      kind: "INITIAL",
      storageKey: `${id}/${revisionId}.vtt`,
      etag: null,
      cueCount: 10,
      byteSize: 500,
      note: "",
      restoredFromRevisionId: null,
      createdBy: null,
      now,
    });
  }
  return replaceSubtitleVersion(state, version);
}

const object = { storageKey: "manual/new.vtt", etag: "e", cueCount: 10, byteSize: 520 };

function save(state: WebinarSubtitleState, versionId: string, expectedRevisionId: string | null) {
  return planManualSave(state, {
    versionId,
    expectedRevisionId,
    object,
    revisionId: "edit-1",
    manualVersionId: "manual-1",
    baselineRevisionId: "baseline-1",
    actor: "admin@ibpassociations.org",
    now,
  });
}

test("editing AI Russian creates RU_MANUAL and leaves the AI version untouched", () => {
  const state = withVersion(emptySubtitleState(), "ai", "RU_AI");
  const plan = save(state, "ai", "ai-r1");
  assert.equal(plan.outcome, "saved");
  if (plan.outcome !== "saved") return;

  assert.equal(plan.createdVersion, true);
  const ai = findSubtitleVersion(plan.state, "ai");
  assert.deepEqual(ai, findSubtitleVersion(state, "ai"));

  const manual = findSubtitleVersion(plan.state, "manual-1");
  assert.equal(manual?.kind, "RU_MANUAL");
  assert.equal(manual?.origin.type, "MANUAL_EDIT");
  assert.equal(manual?.origin.sourceVersionId, "ai");
  assert.equal(manual?.origin.sourceKind, "RU_AI");
  assert.equal(manual?.origin.sourceRevisionId, "ai-r1");
  assert.deepEqual(
    manual?.revisions.map((revision) => [revision.number, revision.kind, revision.storageKey]),
    [
      [1, "BASELINE", "ai/ai-r1.vtt"],
      [2, "EDIT", "manual/new.vtt"],
    ],
  );
});

test("editing SOURCE creates RU_MANUAL and editing AI English creates EN_MANUAL", () => {
  const source = save(withVersion(emptySubtitleState(), "source", "SOURCE"), "source", "source-r1");
  assert.equal(source.outcome === "saved" && findSubtitleVersion(source.state, "manual-1")?.kind, "RU_MANUAL");

  const english = save(withVersion(emptySubtitleState(), "en-ai", "EN_AI"), "en-ai", "en-ai-r1");
  assert.equal(english.outcome === "saved" && findSubtitleVersion(english.state, "manual-1")?.kind, "EN_MANUAL");
  assert.equal(
    english.outcome === "saved" && findSubtitleVersion(english.state, "manual-1")?.language,
    "en",
  );
});

test("editing a manual version appends a revision instead of creating another version", () => {
  const state = withVersion(emptySubtitleState(), "manual", "RU_MANUAL", ["m1", "m2"]);
  const plan = save(state, "manual", "m2");
  assert.equal(plan.outcome, "saved");
  if (plan.outcome !== "saved") return;
  assert.equal(plan.createdVersion, false);
  assert.equal(plan.state.versions.length, 1);
  const manual = findSubtitleVersion(plan.state, "manual");
  assert.deepEqual(manual?.revisions.map((revision) => revision.id), ["m1", "m2", "edit-1"]);
  assert.equal(manual?.currentRevisionId, "edit-1");
});

test("a stale editor is rejected instead of overwriting a newer revision", () => {
  const state = withVersion(emptySubtitleState(), "manual", "RU_MANUAL", ["m1", "m2"]);
  assert.deepEqual(save(state, "manual", "m1"), { outcome: "conflict", currentRevisionId: "m2" });
});

test("restore appends a revision that reuses the earlier object and keeps history", () => {
  const state = withVersion(emptySubtitleState(), "manual", "EN_MANUAL", ["m1", "m2", "m3"]);
  const plan = planRevisionRestore(state, {
    versionId: "manual",
    revisionId: "m1",
    expectedRevisionId: "m3",
    newRevisionId: "m4",
    actor: null,
    now,
  });
  assert.equal(plan.outcome, "saved");
  if (plan.outcome !== "saved") return;
  const manual = findSubtitleVersion(plan.state, "manual")!;
  assert.equal(manual.revisions.length, 4);
  const current = getCurrentRevision(manual)!;
  assert.equal(current.kind, "RESTORE");
  assert.equal(current.storageKey, "manual/m1.vtt");
  assert.equal(current.restoredFromRevisionId, "m1");
  assert.equal(current.note, "Restored revision 1");
});

test("restore is limited to manual versions and to non-current revisions", () => {
  const ai = withVersion(emptySubtitleState(), "ai", "RU_AI", ["a1", "a2"]);
  const input = { versionId: "ai", revisionId: "a1", expectedRevisionId: "a2", newRevisionId: "x", actor: null, now };
  assert.equal(planRevisionRestore(ai, input).outcome, "not-restorable");

  const manual = withVersion(emptySubtitleState(), "m", "RU_MANUAL", ["m1"]);
  assert.equal(
    planRevisionRestore(manual, { ...input, versionId: "m", revisionId: "m1", expectedRevisionId: "m1" }).outcome,
    "not-restorable",
  );
});

test("the member track per language accepts only ready versions of that language", () => {
  let state = withVersion(emptySubtitleState(), "source", "SOURCE");
  state = withVersion(state, "en-ai", "EN_AI");

  const ru = planActiveVersion(state, "ru", "source");
  assert.equal(ru.outcome === "saved" && ru.state.activeVersionIds.ru, "source");
  assert.equal(planActiveVersion(state, "ru", "en-ai").outcome, "invalid");
  assert.equal(planActiveVersion(state, "en", "missing").outcome, "invalid");

  const hidden = planActiveVersion(state, "en", null);
  assert.equal(hidden.outcome === "saved" && hidden.state.activeVersionIds.en, null);
});
