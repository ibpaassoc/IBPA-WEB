import type { ZoomRecordingFile } from "./zoom-recordings";

export const webinarStatuses = ["AVAILABLE", "IMPORTING", "IMPORTED", "FAILED"] as const;
export type WebinarStatus = (typeof webinarStatuses)[number];

export const transcriptStatuses = [
  "AVAILABLE",
  "IMPORTED",
  "NOT_AVAILABLE",
  "FAILED",
] as const;
export type TranscriptStatus = (typeof transcriptStatuses)[number];

export const subtitleLanguages = ["ru", "en", "uk"] as const;
export type SubtitleLanguage = (typeof subtitleLanguages)[number];

export type StoredZoomFile = Pick<
  ZoomRecordingFile,
  | "id"
  | "recording_start"
  | "recording_end"
  | "file_type"
  | "file_extension"
  | "file_size"
  | "status"
  | "recording_type"
>;

export type WebinarZoomMetadata = {
  hostId?: string;
  hostEmail?: string;
  timezone?: string;
  totalSize?: number;
  recordingFiles: StoredZoomFile[];
  importError?: string | null;
  transcriptSourceRecordingFileId?: string | null;
  transcriptLanguage?: "ru";
};
