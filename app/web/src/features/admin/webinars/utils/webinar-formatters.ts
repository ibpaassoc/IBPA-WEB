import type { AdminWebinar, WebinarStatus } from "../types/webinar.types";

export function formatWebinarDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainder = safeSeconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(index > 2 ? 1 : 0)} ${units[index]}`;
}

export function getWebinarMp4Types(webinar: AdminWebinar) {
  const types = (webinar.zoomMetadata.recordingFiles || [])
    .filter(
      (file) =>
        (file.file_type || file.file_extension || "").toUpperCase() === "MP4",
    )
    .map((file) => (file.recording_type || "video").replaceAll("_", " "));
  return Array.from(new Set(types));
}

export function getWebinarMp4Size(webinar: AdminWebinar) {
  const files = (webinar.zoomMetadata.recordingFiles || []).filter(
    (file) =>
      (file.file_type || file.file_extension || "").toUpperCase() === "MP4",
  );
  const selected = files.find(
    (file) => file.id === webinar.zoomRecordingFileId,
  );
  return (
    selected?.file_size ||
    Math.max(0, ...files.map((file) => Number(file.file_size || 0)))
  );
}

export function webinarStatusLabel(status: WebinarStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export const MAX_WEBINAR_TITLE_LENGTH = 255;

/** Mirrors the backend rule: collapse whitespace, required, at most 255 characters. */
export function normalizeWebinarTitle(value: string) {
  const title = value.replace(/\s+/g, " ").trim();
  if (!title) return { title, error: "Enter a webinar title." };
  if (title.length > MAX_WEBINAR_TITLE_LENGTH) {
    return {
      title,
      error: `Keep the title under ${MAX_WEBINAR_TITLE_LENGTH} characters.`,
    };
  }
  return { title, error: null };
}
