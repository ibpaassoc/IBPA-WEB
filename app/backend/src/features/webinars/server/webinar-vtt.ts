export type WebinarVttCue = {
  id?: string;
  start: string;
  end: string;
  settings?: string;
  text: string;
};

const TIMING_LINE = /^(\d{2,}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})\s+-->\s+(\d{2,}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})(?:\s+(.*))?$/;

export function parseWebinarVtt(source: string): WebinarVttCue[] {
  const normalized = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
  if (!normalized.startsWith("WEBVTT")) {
    throw new Error("Subtitle file is not valid WebVTT.");
  }

  const cues: WebinarVttCue[] = [];
  for (const block of normalized.split(/\n{2,}/).slice(1)) {
    const lines = block.split("\n");
    if (!lines.length || /^(NOTE|STYLE|REGION)(?:\s|$)/.test(lines[0])) continue;

    let timingIndex = 0;
    let id: string | undefined;
    if (!TIMING_LINE.test(lines[0])) {
      id = lines[0].trim() || undefined;
      timingIndex = 1;
    }

    const timing = lines[timingIndex]?.match(TIMING_LINE);
    if (!timing) continue;

    cues.push({
      id,
      start: timing[1],
      end: timing[2],
      settings: timing[3]?.trim() || undefined,
      text: lines.slice(timingIndex + 1).join("\n"),
    });
  }

  return cues;
}

export function serializeWebinarVtt(cues: WebinarVttCue[]) {
  const blocks = cues.map((cue) => {
    const id = cue.id ? `${cue.id}\n` : "";
    const settings = cue.settings ? ` ${cue.settings}` : "";
    return `${id}${cue.start} --> ${cue.end}${settings}\n${cue.text}`;
  });
  return `WEBVTT\n\n${blocks.join("\n\n")}\n`;
}

/** Drops empty cues and renumbers ids so generated tracks are editor-ready. */
export function normalizeGeneratedVtt(source: string) {
  const cues = parseWebinarVtt(source)
    .map((cue) => ({ ...cue, text: cue.text.trim() }))
    .filter((cue) => cue.text);
  if (!cues.length) {
    throw new Error("No speech was recognized in this recording.");
  }
  return serializeWebinarVtt(
    cues.map((cue, index) => ({ ...cue, id: String(index + 1) })),
  );
}
