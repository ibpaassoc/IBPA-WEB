import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeGeneratedVtt,
  parseWebinarVtt,
  serializeWebinarVtt,
} from "./webinar-vtt";

test("parses and serializes timestamped WebVTT cues", () => {
  const source = `WEBVTT\n\nintro\n00:00:01.000 --> 00:00:03.500 align:start\nПривет\nмир\n\n00:04.000 --> 00:06.000\nЕще текст\n`;
  const cues = parseWebinarVtt(source);

  assert.deepEqual(cues, [
    {
      id: "intro",
      start: "00:00:01.000",
      end: "00:00:03.500",
      settings: "align:start",
      text: "Привет\nмир",
    },
    {
      id: undefined,
      start: "00:04.000",
      end: "00:06.000",
      settings: undefined,
      text: "Еще текст",
    },
  ]);

  assert.deepEqual(parseWebinarVtt(serializeWebinarVtt(cues)), cues);
});

test("rejects non-WebVTT input", () => {
  assert.throws(() => parseWebinarVtt("plain text"), /WebVTT/);
});

test("normalizes generated transcripts into editor-ready cues", () => {
  const source = `WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n  Добрый день  \n\n00:00:02.000 --> 00:00:03.000\n \n\n00:00:03.500 --> 00:00:05.000\nНачинаем вебинар`;
  const cues = parseWebinarVtt(normalizeGeneratedVtt(source));
  assert.deepEqual(
    cues.map((cue) => [cue.id, cue.start, cue.text]),
    [
      ["1", "00:00:01.000", "Добрый день"],
      ["2", "00:00:03.500", "Начинаем вебинар"],
    ],
  );
  assert.throws(
    () => normalizeGeneratedVtt("WEBVTT\n\n00:00:01.000 --> 00:00:02.000\n \n"),
    /No speech/,
  );
});
