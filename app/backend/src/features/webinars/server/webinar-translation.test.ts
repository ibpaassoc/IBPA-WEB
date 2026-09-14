import assert from "node:assert/strict";
import test from "node:test";
import {
  translateCuesToEnglish,
  type BatchTranslator,
  type TranslatableCue,
} from "./webinar-translation";
import {
  appendSubtitleRevision,
  createSubtitleVersion,
  isEnglishTranslationSource,
  type SubtitleVersionKind,
} from "./webinar-subtitle-state";

const now = new Date("2026-09-14T10:00:00.000Z");

function readyVersion(kind: SubtitleVersionKind) {
  return appendSubtitleRevision(
    createSubtitleVersion({
      kind,
      origin: { type: "LEGACY_TRACK" },
      status: "READY",
      createdBy: null,
      now,
    }),
    {
      id: `${kind}-r1`,
      kind: "INITIAL",
      storageKey: `${kind}.vtt`,
      etag: null,
      cueCount: 1,
      byteSize: 1,
      note: "",
      restoredFromRevisionId: null,
      createdBy: null,
      now,
    },
  );
}

test("English can be translated from Source, AI Russian, or Manual Russian — never from English", () => {
  assert.equal(isEnglishTranslationSource(readyVersion("SOURCE")), true);
  assert.equal(isEnglishTranslationSource(readyVersion("RU_AI")), true);
  assert.equal(isEnglishTranslationSource(readyVersion("RU_MANUAL")), true);
  assert.equal(isEnglishTranslationSource(readyVersion("EN_AI")), false);
  assert.equal(isEnglishTranslationSource(readyVersion("EN_MANUAL")), false);

  const processing = createSubtitleVersion({
    kind: "RU_AI",
    origin: { type: "AI_TRANSCRIPTION" },
    status: "PROCESSING",
    createdBy: null,
    now,
  });
  assert.equal(isEnglishTranslationSource(processing), false);
});

function cues(count: number): TranslatableCue[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `c${index}`,
    text: `Реплика ${index}`,
  }));
}

test("translates every cue in ordered batches with prior context", async () => {
  const calls: Array<{ ids: string[]; context: string[] }> = [];
  const translator: BatchTranslator = async (batch, context) => {
    calls.push({ ids: batch.map((cue) => cue.id), context: context.map((cue) => cue.text) });
    return new Map(batch.map((cue) => [cue.id, cue.text.replace("Реплика", "Line")]));
  };
  const progress: number[] = [];

  const result = await translateCuesToEnglish(
    cues(130),
    async (completed) => {
      progress.push(completed);
    },
    translator,
  );

  assert.equal(result.size, 130);
  assert.equal(result.get("c129"), "Line 129");
  assert.deepEqual(progress, [60, 120, 130]);
  assert.equal(calls[0].context.length, 0);
  // The second batch sees the last translated cues of the first batch.
  assert.deepEqual(calls[1].context.slice(-2), ["Line 58", "Line 59"]);
});

test("retries missing cues once and fails loudly if they are still missing", async () => {
  let attempts = 0;
  const flaky: BatchTranslator = async (batch) => {
    attempts += 1;
    // First call drops c1; the retry returns it.
    return new Map(
      batch
        .filter((cue) => attempts > 1 || cue.id !== "c1")
        .map((cue) => [cue.id, `EN ${cue.id}`]),
    );
  };
  const result = await translateCuesToEnglish(cues(3), undefined, flaky);
  assert.equal(result.get("c1"), "EN c1");
  assert.equal(attempts, 2);

  const broken: BatchTranslator = async (batch) =>
    new Map(batch.filter((cue) => cue.id !== "c2").map((cue) => [cue.id, "x"]));
  await assert.rejects(
    translateCuesToEnglish(cues(3), undefined, broken),
    /incomplete \(1 cues missing\)/,
  );
});
