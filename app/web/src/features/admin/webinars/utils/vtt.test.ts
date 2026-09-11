import assert from "node:assert/strict";
import test from "node:test";
import {
  findActiveCueIndex,
  parseVtt,
  secondsToTimecode,
  serializeVtt,
  timecodeToSeconds,
  validateVttCues,
} from "./vtt";

test("WebVTT cue round trip preserves timestamps and text", () => {
  const cues = parseVtt("WEBVTT\n\n1\n00:00:01.000 --> 00:00:03.000\nПривет\n");
  assert.equal(cues.length, 1);
  assert.equal(cues[0].text, "Привет");
  assert.equal(parseVtt(serializeVtt(cues))[0].start, "00:00:01.000");
});

test("time helpers format and find active cues", () => {
  assert.equal(timecodeToSeconds("01:02:03.500"), 3723.5);
  assert.equal(secondsToTimecode(62.25), "00:01:02.250");
  const cues = parseVtt("WEBVTT\n\n00:01.000 --> 00:03.000\nOne\n\n00:04.000 --> 00:05.000\nTwo");
  assert.equal(findActiveCueIndex(cues, 4.2), 1);
  assert.equal(validateVttCues(cues), null);
});
