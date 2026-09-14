import assert from "node:assert/strict";
import test from "node:test";
import {
  alignSubtitleCues,
  diffText,
  diffTokens,
  summarizeAlignment,
} from "./subtitle-diff";
import type { VttCue } from "./vtt";

const loose = { ignoreCaseAndPunctuation: true };
const strict = { ignoreCaseAndPunctuation: false };

function cue(start: string, end: string, text: string, id = start): VttCue {
  return { id, start: `00:00:${start}`, end: `00:00:${end}`, text };
}

function render(segments: { kind: string; text: string }[]) {
  return segments
    .map((segment) =>
      segment.kind === "equal" ? segment.text : `[${segment.kind[0]}:${segment.text.trim()}]`,
    )
    .join("")
    .trim();
}

test("a single replaced word highlights only that word on both sides", () => {
  const result = diffText(
    "Сегодня мы разберём технику окрашивания бровей",
    "Сегодня мы разберём технику оформления бровей",
    loose,
  );
  assert.equal(render(result.left), "Сегодня мы разберём технику [r:окрашивания]бровей");
  assert.equal(render(result.right), "Сегодня мы разберём технику [a:оформления]бровей");
  assert.equal(result.removedWords, 1);
  assert.equal(result.addedWords, 1);
});

test("added and removed words are distinguished from unchanged text", () => {
  const result = diffText("мастер наносит краску", "мастер аккуратно наносит", loose);
  assert.equal(render(result.left), "мастер наносит [r:краску]");
  assert.equal(render(result.right), "мастер [a:аккуратно]наносит");
});

test("case, ё/е, and punctuation differences can be ignored or shown", () => {
  const same = diffText("Привет, всем!", "привет всем", loose);
  assert.equal(same.removedWords + same.addedWords, 0);

  const shown = diffText("Привет, всем!", "привет всем", strict);
  assert.equal(shown.removedWords, 2);
  assert.equal(diffText("ещё", "еще", loose).addedWords, 0);
});

test("Myers diff handles empty sides", () => {
  assert.deepEqual(diffTokens([], []), []);
  assert.deepEqual(
    diffTokens(["a"], []).map((op) => op.kind),
    ["removed"],
  );
  assert.deepEqual(
    diffTokens([], ["a", "b"]).map((op) => op.kind),
    ["added", "added"],
  );
});

test("identical timings pair segment-by-segment", () => {
  const rows = alignSubtitleCues(
    [cue("01.000", "03.000", "Добрый день"), cue("03.000", "05.000", "Начинаем урок")],
    [cue("01.000", "03.000", "Добрый день"), cue("03.000", "05.000", "Начинаем занятие")],
  );
  assert.deepEqual(
    rows.map((row) => [row.leftCueIndexes, row.rightCueIndexes, row.status]),
    [
      [[0], [0], "same"],
      [[1], [1], "changed"],
    ],
  );
  assert.equal(rows[1].start, 3);
});

test("offset segmentation aligns by dominant overlap instead of chaining everything", () => {
  const left = [
    cue("00.000", "03.000", "раз два"),
    cue("03.000", "06.000", "три четыре"),
    cue("06.000", "09.000", "пять шесть"),
  ];
  const right = [
    cue("01.000", "04.000", "раз два"),
    cue("04.000", "07.000", "три четыре"),
    cue("07.000", "10.000", "пять семь"),
  ];
  const rows = alignSubtitleCues(left, right);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows.map((row) => row.status), ["same", "same", "changed"]);
});

test("one long cue on one side groups with every cue it covers", () => {
  const rows = alignSubtitleCues(
    [
      cue("00.000", "02.000", "первая"),
      cue("02.000", "04.000", "вторая"),
      cue("04.000", "06.000", "третья"),
    ],
    [cue("00.000", "06.000", "первая вторая третья")],
  );
  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].leftCueIndexes, [0, 1, 2]);
  assert.equal(rows[0].status, "same");
});

test("cues without a counterpart are reported per side", () => {
  const rows = alignSubtitleCues(
    [cue("00.000", "02.000", "только слева")],
    [cue("10.000", "12.000", "only right")],
  );
  assert.deepEqual(rows.map((row) => row.status), ["left-only", "right-only"]);
  assert.deepEqual(summarizeAlignment(rows), {
    rows: 2,
    changedRows: 2,
    removedWords: 2,
    addedWords: 2,
  });
});

test("edit scripts always rebuild both sides and are minimal for small inputs", () => {
  let seed = 7;
  const random = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const lcsLength = (a: string[], b: string[]) => {
    const table = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        table[i][j] =
          a[i - 1] === b[j - 1]
            ? table[i - 1][j - 1] + 1
            : Math.max(table[i - 1][j], table[i][j - 1]);
      }
    }
    return table[a.length][b.length];
  };

  for (let run = 0; run < 300; run += 1) {
    const words = () =>
      Array.from({ length: Math.floor(random() * 9) }, () => "abcd"[Math.floor(random() * 4)]);
    const left = words();
    const right = words();
    const ops = diffTokens(left, right);
    assert.deepEqual(
      ops.filter((op) => op.kind !== "added").map((op) => left[op.leftIndex]),
      left,
    );
    assert.deepEqual(
      ops.filter((op) => op.kind !== "removed").map((op) => right[op.rightIndex]),
      right,
    );
    assert.equal(ops.filter((op) => op.kind === "equal").length, lcsLength(left, right));
  }
});
