import assert from "node:assert/strict";
import test from "node:test";
import type {
  SubtitleVersion,
  SubtitleVersionKind,
  WebinarSubtitleState,
} from "../types/webinar.types";
import {
  lineageLabel,
  manualVersionsFrom,
  navigatorLanes,
  translationSources,
  versionName,
} from "./subtitle-versions";

let clock = 0;
function version(
  id: string,
  kind: SubtitleVersionKind,
  origin: Partial<SubtitleVersion["origin"]> = {},
  status: SubtitleVersion["status"] = "READY",
): SubtitleVersion {
  clock += 1;
  const createdAt = new Date(Date.UTC(2026, 8, 14, 10, clock)).toISOString();
  return {
    id,
    kind,
    language: kind.startsWith("EN") ? "en" : "ru",
    status,
    error: null,
    origin: {
      type: "LEGACY_TRACK",
      sourceVersionId: null,
      sourceRevisionId: null,
      sourceKind: null,
      provider: null,
      model: null,
      ...origin,
    },
    currentRevisionId: status === "READY" ? `${id}-r1` : null,
    revisions:
      status === "READY"
        ? [
            {
              id: `${id}-r1`,
              number: 1,
              kind: "INITIAL",
              storageKey: `${id}.vtt`,
              etag: null,
              cueCount: 1,
              byteSize: 1,
              note: "",
              restoredFromRevisionId: null,
              createdAt,
              createdBy: null,
            },
          ]
        : [],
    job: null,
    createdAt,
    createdBy: null,
    updatedAt: createdAt,
  };
}

function state(versions: SubtitleVersion[]): WebinarSubtitleState {
  return {
    schemaVersion: 1,
    stateVersion: 1,
    versions,
    activeVersionIds: { ru: null, en: null },
    legacyTracks: [],
    migratedAt: null,
  };
}

const source = version("source", "SOURCE", { type: "ZOOM_IMPORT" });
const ruAi = version("ru-ai", "RU_AI", { type: "AI_TRANSCRIPTION" });
const ruManual = version("ru-manual", "RU_MANUAL", {
  type: "MANUAL_EDIT",
  sourceVersionId: "ru-ai",
  sourceKind: "RU_AI",
});
const enFromSource = version("en-source", "EN_AI", {
  type: "AI_TRANSLATION",
  sourceVersionId: "source",
  sourceKind: "SOURCE",
});
const enFromManual = version("en-manual-ru", "EN_AI", {
  type: "AI_TRANSLATION",
  sourceVersionId: "ru-manual",
  sourceKind: "RU_MANUAL",
});
const enManual = version("en-manual", "EN_MANUAL", {
  type: "MANUAL_EDIT",
  sourceVersionId: "en-manual-ru",
  sourceKind: "EN_AI",
});
const all = state([source, ruAi, ruManual, enFromSource, enFromManual, enManual]);

test("names describe where each translation came from", () => {
  assert.equal(versionName(all, source), "Zoom original");
  assert.equal(versionName(all, ruAi), "AI generated");
  assert.equal(versionName(all, ruManual), "Manual correction");
  assert.equal(versionName(all, enFromSource), "AI from Source");
  assert.equal(versionName(all, enFromManual), "AI from Manual Russian");
  assert.equal(versionName(all, enManual), "Manual correction");

  const secondManual = version("ru-manual-2", "RU_MANUAL", {
    type: "MANUAL_EDIT",
    sourceVersionId: "source",
    sourceKind: "SOURCE",
  });
  const withTwo = state([...all.versions, secondManual]);
  assert.equal(versionName(withTwo, ruManual), "Manual correction · from AI Russian");
  assert.equal(versionName(withTwo, secondManual), "Manual correction · from Source");
});

test("lineage labels follow the full chain back to its root", () => {
  assert.equal(lineageLabel(all, enFromSource), "SOURCE → EN_AI");
  assert.equal(lineageLabel(all, enManual), "RU_AI → RU_MANUAL → EN_AI → EN_MANUAL");
});

test("lanes group versions as Source → Russian → English", () => {
  assert.deepEqual(
    navigatorLanes(all).map((lane) => [lane.title, lane.versions.map((item) => item.id)]),
    [
      ["Source", ["source"]],
      ["Russian", ["ru-ai", "ru-manual"]],
      ["English", ["en-source", "en-manual-ru", "en-manual"]],
    ],
  );
});

test("translation sources are the ready Russian-language versions only", () => {
  const processing = version("ru-ai-2", "RU_AI", { type: "AI_TRANSCRIPTION" }, "PROCESSING");
  const withProcessing = state([...all.versions, processing]);
  assert.deepEqual(
    translationSources(withProcessing).map((item) => item.id),
    ["source", "ru-ai", "ru-manual"],
  );
  assert.deepEqual(manualVersionsFrom(all, "ru-ai").map((item) => item.id), ["ru-manual"]);
});
