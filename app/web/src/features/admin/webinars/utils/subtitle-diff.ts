import { timecodeToSeconds, type VttCue } from "./vtt";

/**
 * Subtitle comparison.
 *
 * 1. Alignment: versions from different sources rarely share cue boundaries
 *    (Zoom and AI transcripts segment speech differently). Each cue is linked
 *    to the cue on the other side it overlaps most in time; linked cues form
 *    one aligned row. Identical timings (translations, manual edits) pair 1:1.
 * 2. Word diff: inside a row, words are compared with a Myers diff, so one
 *    changed word highlights one word, not the whole segment.
 */

export type DiffSegmentKind = "equal" | "removed" | "added";
export type DiffSegment = { kind: DiffSegmentKind; text: string };

export type AlignedRowStatus = "same" | "changed" | "left-only" | "right-only";

export type AlignedRow = {
  id: string;
  start: number;
  end: number;
  leftCueIndexes: number[];
  rightCueIndexes: number[];
  left: DiffSegment[];
  right: DiffSegment[];
  status: AlignedRowStatus;
  removedWords: number;
  addedWords: number;
};

export type CompareOptions = {
  /** Treat "Привет," and "привет" as the same word. */
  ignoreCaseAndPunctuation: boolean;
};

type TimedCue = { index: number; start: number; end: number; text: string };

function toTimed(cues: VttCue[]): TimedCue[] {
  return cues
    .map((cue, index) => ({
      index,
      start: timecodeToSeconds(cue.start),
      end: timecodeToSeconds(cue.end),
      text: cue.text,
    }))
    .filter((cue) => Number.isFinite(cue.start) && Number.isFinite(cue.end))
    .sort((a, b) => a.start - b.start || a.end - b.end);
}

function overlap(a: TimedCue, b: TimedCue) {
  return Math.min(a.end, b.end) - Math.max(a.start, b.start);
}

/** For each cue in `from`, the index (into `to`) of the cue it overlaps most. */
function bestOverlaps(from: TimedCue[], to: TimedCue[]) {
  const result = new Array<number>(from.length).fill(-1);
  let windowStart = 0;
  for (let i = 0; i < from.length; i += 1) {
    const cue = from[i];
    while (windowStart < to.length && to[windowStart].end <= cue.start) {
      windowStart += 1;
    }
    let best = -1;
    let bestOverlap = 0;
    for (let j = windowStart; j < to.length && to[j].start < cue.end; j += 1) {
      const amount = overlap(cue, to[j]);
      if (amount > bestOverlap) {
        best = j;
        bestOverlap = amount;
      }
    }
    result[i] = best;
  }
  return result;
}

function createUnionFind(size: number) {
  const parent = Array.from({ length: size }, (_, index) => index);
  const find = (index: number): number => {
    while (parent[index] !== index) {
      parent[index] = parent[parent[index]];
      index = parent[index];
    }
    return index;
  };
  const union = (a: number, b: number) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[rootB] = rootA;
  };
  return { find, union };
}

export function tokenize(text: string) {
  return text.replace(/\s+/g, " ").trim().match(/\S+\s*/g) ?? [];
}

export function normalizeToken(token: string, options: CompareOptions) {
  const trimmed = token.trim();
  if (!options.ignoreCaseAndPunctuation) return trimmed;
  const stripped = trimmed
    .toLocaleLowerCase()
    .replace(/ё/g, "е")
    .replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, "");
  // Pure punctuation tokens ("—", "...") still need a stable identity.
  return stripped || trimmed;
}

type EditOp = { kind: DiffSegmentKind; leftIndex: number; rightIndex: number };

/** Beyond this, a row is shown as fully replaced to bound memory. */
const MAX_DIFF_TOKENS = 1_600;

/** Myers O((N+M)·D) shortest edit script over token keys. */
export function diffTokens(left: string[], right: string[]): EditOp[] {
  const n = left.length;
  const m = right.length;
  if (n + m > MAX_DIFF_TOKENS) {
    return [
      ...left.map((_, index) => ({ kind: "removed" as const, leftIndex: index, rightIndex: 0 })),
      ...right.map((_, index) => ({ kind: "added" as const, leftIndex: n, rightIndex: index })),
    ];
  }
  const max = n + m;
  const offset = max;
  const v = new Int32Array(2 * max + 2);
  const trace: Int32Array[] = [];

  let found = n === 0 && m === 0;
  for (let d = 0; d <= max && !found; d += 1) {
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      let x =
        k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])
          ? v[offset + k + 1]
          : v[offset + k - 1] + 1;
      let y = x - k;
      while (x < n && y < m && left[x] === right[y]) {
        x += 1;
        y += 1;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) {
        found = true;
        break;
      }
    }
  }

  // Backtrack from (n, m) to (0, 0).
  const ops: EditOp[] = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d >= 0; d -= 1) {
    const snapshot = trace[d];
    const k = x - y;
    const prevK =
      k === -d || (k !== d && snapshot[offset + k - 1] < snapshot[offset + k + 1])
        ? k + 1
        : k - 1;
    const prevX = snapshot[offset + prevK];
    const prevY = prevX - prevK;
    while (x > prevX && y > prevY) {
      x -= 1;
      y -= 1;
      ops.push({ kind: "equal", leftIndex: x, rightIndex: y });
    }
    if (d === 0) break;
    if (x === prevX) {
      y -= 1;
      ops.push({ kind: "added", leftIndex: x, rightIndex: y });
    } else {
      x -= 1;
      ops.push({ kind: "removed", leftIndex: x, rightIndex: y });
    }
  }
  return ops.reverse();
}

function mergeSegments(segments: DiffSegment[]) {
  const merged: DiffSegment[] = [];
  for (const segment of segments) {
    const last = merged.at(-1);
    if (last && last.kind === segment.kind) last.text += segment.text;
    else merged.push({ ...segment });
  }
  return merged;
}

/** Word-level highlights for both sides of one aligned row. */
export function diffText(leftText: string, rightText: string, options: CompareOptions) {
  const leftTokens = tokenize(leftText);
  const rightTokens = tokenize(rightText);
  const ops = diffTokens(
    leftTokens.map((token) => normalizeToken(token, options)),
    rightTokens.map((token) => normalizeToken(token, options)),
  );

  const left: DiffSegment[] = [];
  const right: DiffSegment[] = [];
  let removedWords = 0;
  let addedWords = 0;
  for (const op of ops) {
    if (op.kind === "equal") {
      left.push({ kind: "equal", text: leftTokens[op.leftIndex] });
      right.push({ kind: "equal", text: rightTokens[op.rightIndex] });
    } else if (op.kind === "removed") {
      left.push({ kind: "removed", text: leftTokens[op.leftIndex] });
      removedWords += 1;
    } else {
      right.push({ kind: "added", text: rightTokens[op.rightIndex] });
      addedWords += 1;
    }
  }
  return {
    left: mergeSegments(left),
    right: mergeSegments(right),
    removedWords,
    addedWords,
  };
}

export function alignSubtitleCues(
  leftCues: VttCue[],
  rightCues: VttCue[],
  options: CompareOptions = { ignoreCaseAndPunctuation: true },
): AlignedRow[] {
  const left = toTimed(leftCues);
  const right = toTimed(rightCues);
  const unionFind = createUnionFind(left.length + right.length);

  bestOverlaps(left, right).forEach((match, index) => {
    if (match >= 0) unionFind.union(index, left.length + match);
  });
  bestOverlaps(right, left).forEach((match, index) => {
    if (match >= 0) unionFind.union(left.length + index, match);
  });

  const groups = new Map<number, { left: TimedCue[]; right: TimedCue[] }>();
  const groupFor = (node: number) => {
    const root = unionFind.find(node);
    let group = groups.get(root);
    if (!group) {
      group = { left: [], right: [] };
      groups.set(root, group);
    }
    return group;
  };
  left.forEach((cue, index) => groupFor(index).left.push(cue));
  right.forEach((cue, index) => groupFor(left.length + index).right.push(cue));

  return Array.from(groups.values())
    .map((group) => {
      const cues = [...group.left, ...group.right];
      const start = Math.min(...cues.map((cue) => cue.start));
      const end = Math.max(...cues.map((cue) => cue.end));
      const leftText = group.left.map((cue) => cue.text).join(" ");
      const rightText = group.right.map((cue) => cue.text).join(" ");
      const diff = diffText(leftText, rightText, options);
      const status: AlignedRowStatus = !group.left.length
        ? "right-only"
        : !group.right.length
          ? "left-only"
          : diff.removedWords || diff.addedWords
            ? "changed"
            : "same";
      return {
        id: `${start}-${group.left[0]?.index ?? "x"}-${group.right[0]?.index ?? "x"}`,
        start,
        end,
        leftCueIndexes: group.left.map((cue) => cue.index),
        rightCueIndexes: group.right.map((cue) => cue.index),
        left: diff.left,
        right: diff.right,
        status,
        removedWords: diff.removedWords,
        addedWords: diff.addedWords,
      };
    })
    .sort((a, b) => a.start - b.start || a.end - b.end);
}

export function summarizeAlignment(rows: AlignedRow[]) {
  return rows.reduce(
    (summary, row) => ({
      rows: summary.rows + 1,
      changedRows: summary.changedRows + (row.status === "same" ? 0 : 1),
      removedWords: summary.removedWords + row.removedWords,
      addedWords: summary.addedWords + row.addedWords,
    }),
    { rows: 0, changedRows: 0, removedWords: 0, addedWords: 0 },
  );
}
