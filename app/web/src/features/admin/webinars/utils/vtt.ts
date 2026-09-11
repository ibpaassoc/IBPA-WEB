export type VttCue = {
  id: string;
  start: string;
  end: string;
  settings?: string;
  text: string;
};

const TIMING_LINE = /^(\d{2,}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})\s+-->\s+(\d{2,}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})(?:\s+(.*))?$/;

export function parseVtt(source: string): VttCue[] {
  const normalized = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
  if (!normalized.startsWith("WEBVTT")) throw new Error("Subtitle file is not valid WebVTT.");

  const cues: VttCue[] = [];
  for (const block of normalized.split(/\n{2,}/).slice(1)) {
    const lines = block.split("\n");
    if (!lines.length || /^(NOTE|STYLE|REGION)(?:\s|$)/.test(lines[0])) continue;
    let timingIndex = 0;
    let id = "";
    if (!TIMING_LINE.test(lines[0])) {
      id = lines[0].trim();
      timingIndex = 1;
    }
    const timing = lines[timingIndex]?.match(TIMING_LINE);
    if (!timing) continue;
    cues.push({
      id: id || crypto.randomUUID(),
      start: timing[1],
      end: timing[2],
      settings: timing[3]?.trim() || undefined,
      text: lines.slice(timingIndex + 1).join("\n"),
    });
  }
  return cues;
}

export function serializeVtt(cues: VttCue[]) {
  const blocks = cues.map((cue) => {
    const settings = cue.settings ? ` ${cue.settings}` : "";
    return `${cue.id}\n${cue.start} --> ${cue.end}${settings}\n${cue.text.trim()}`;
  });
  return `WEBVTT\n\n${blocks.join("\n\n")}\n`;
}

export function timecodeToSeconds(value: string) {
  const parts = value.split(":");
  if (parts.length !== 2 && parts.length !== 3) return Number.NaN;
  const secondsPart = Number(parts.pop());
  const minutes = Number(parts.pop());
  const hours = Number(parts.pop() || 0);
  if (![hours, minutes, secondsPart].every(Number.isFinite) || minutes < 0 || minutes >= 60 || secondsPart < 0 || secondsPart >= 60) {
    return Number.NaN;
  }
  return hours * 3600 + minutes * 60 + secondsPart;
}

export function secondsToTimecode(value: number) {
  const milliseconds = Math.max(0, Math.round(value * 1000));
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const seconds = Math.floor((milliseconds % 60_000) / 1000);
  const fraction = milliseconds % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(fraction).padStart(3, "0")}`;
}

export function validateVttCues(cues: VttCue[]) {
  for (let index = 0; index < cues.length; index += 1) {
    const cue = cues[index];
    const start = timecodeToSeconds(cue.start);
    const end = timecodeToSeconds(cue.end);
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return `Cue ${index + 1} has an invalid timestamp. Use HH:MM:SS.mmm.`;
    }
    if (start >= end) return `Cue ${index + 1} must end after it starts.`;
  }
  return null;
}

export function findActiveCueIndex(cues: VttCue[], currentTime: number) {
  return cues.findIndex(
    (cue) => currentTime >= timecodeToSeconds(cue.start) && currentTime < timecodeToSeconds(cue.end),
  );
}
