import assert from "node:assert/strict";
import test from "node:test";
import {
  findActiveCueIndex,
  parseVtt,
  secondsToTimecode,
  serializeVtt,
  timecodeToSeconds,
  validateVttCues,
  visibleCueIndex,
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

test("switching subtitle tracks mid-playback never selects a cue outside the new list", () => {
  const russian = parseVtt(
    `WEBVTT\n\n${Array.from({ length: 60 }, (_, index) => `${index + 1}\n${secondsToTimecode(index * 2)} --> ${secondsToTimecode(index * 2 + 2)}\nСтрока ${index}`).join("\n\n")}\n`,
  );
  const english = parseVtt(
    "WEBVTT\n\n1\n00:00:00.000 --> 00:00:10.000\nLine 0\n\n2\n00:01:50.000 --> 00:02:00.000\nLine 1\n",
  );
  // Frame index 57 was computed for the Russian list while playing at ~115 s.
  const frame = { cues: russian, index: 57 };

  assert.equal(visibleCueIndex({ cues: russian, currentTime: 115, frame }), 57);
  // After switching to English the stale index is ignored; time decides.
  assert.equal(visibleCueIndex({ cues: english, currentTime: 115, frame }), 1);
  assert.equal(visibleCueIndex({ cues: english, currentTime: 60, frame }), -1);
  // Turning subtitles off mid-playback.
  assert.equal(visibleCueIndex({ cues: [], currentTime: 115, frame }), -1);
  // A frame index can never point past the list it claims to belong to.
  assert.equal(visibleCueIndex({ cues: english, currentTime: 0, frame: { cues: english, index: 9 } }), -1);
});
