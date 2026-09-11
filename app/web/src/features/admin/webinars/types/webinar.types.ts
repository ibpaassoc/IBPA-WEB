export type WebinarStatus = "AVAILABLE" | "IMPORTING" | "IMPORTED" | "FAILED";
export type TranscriptStatus = "AVAILABLE" | "IMPORTED" | "NOT_AVAILABLE" | "FAILED";
export type SubtitleLanguage = "ru" | "en" | "uk";

export type WebinarZoomFile = {
  id: string;
  file_type?: string;
  file_extension?: string;
  file_size?: number;
  recording_type?: string;
};

export type WebinarZoomMetadata = {
  hostEmail?: string;
  hostId?: string;
  timezone?: string;
  totalSize?: number;
  recordingFiles?: WebinarZoomFile[];
  importError?: string | null;
  transcriptSourceRecordingFileId?: string | null;
  transcriptLanguage?: "ru";
};

export type AdminWebinar = {
  id: string;
  title: string;
  zoomMeetingId: string;
  zoomMeetingUuid: string;
  zoomRecordingFileId: string | null;
  recordedAt: string;
  durationSeconds: number;
  videoR2Key: string | null;
  status: WebinarStatus;
  transcriptStatus: TranscriptStatus;
  zoomMetadata: WebinarZoomMetadata;
  createdAt: string;
  updatedAt: string;
};

export type WebinarListResponse = {
  items: AdminWebinar[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type WebinarImportOption = {
  id: string;
  recordingType: string;
  fileSize: number;
  recordingStart: string | null;
  recordingEnd: string | null;
};

export type WebinarStoredObject = {
  contentLength: number | null;
  contentType: string | null;
  etag: string | null;
  lastModified: string | null;
  metadata?: Record<string, string>;
};

export type WebinarSubtitleTrack = WebinarStoredObject & {
  language: SubtitleLanguage;
  exists: boolean;
};

export type AdminWebinarDetail = AdminWebinar & {
  storage: { video: WebinarStoredObject | null };
  tracks: WebinarSubtitleTrack[];
};

export type WebinarSubtitleDocument = {
  language: SubtitleLanguage;
  etag: string | null;
  text: string;
};
