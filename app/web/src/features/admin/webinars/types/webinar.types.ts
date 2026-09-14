export type WebinarStatus = "AVAILABLE" | "IMPORTING" | "IMPORTED" | "FAILED";
export type TranscriptStatus = "AVAILABLE" | "IMPORTED" | "NOT_AVAILABLE" | "FAILED";

export type WebinarZoomFile = {
  id: string;
  file_type?: string;
  file_extension?: string;
  file_size?: number;
  recording_type?: string;
};

export type WebinarZoomMetadata = {
  /** Meeting topic from the latest Zoom sync. */
  topic?: string | null;
  hostEmail?: string;
  hostId?: string;
  timezone?: string;
  totalSize?: number;
  recordingFiles?: WebinarZoomFile[];
  importError?: string | null;
  transcriptSourceRecordingFileId?: string | null;
  transcriptLanguage?: "ru";
};

export type SubtitleVersionKind =
  | "SOURCE"
  | "RU_AI"
  | "RU_MANUAL"
  | "EN_AI"
  | "EN_MANUAL";
export type SubtitleTrackLanguage = "ru" | "en";
export type SubtitleVersionStatus = "READY" | "PROCESSING" | "FAILED";
export type SubtitleOriginType =
  | "ZOOM_IMPORT"
  | "AI_TRANSCRIPTION"
  | "AI_TRANSLATION"
  | "MANUAL_EDIT"
  | "LEGACY_TRACK";

export type SubtitleRevision = {
  id: string;
  number: number;
  kind: "INITIAL" | "BASELINE" | "EDIT" | "RESTORE";
  storageKey: string;
  etag: string | null;
  cueCount: number;
  byteSize: number;
  note: string;
  restoredFromRevisionId: string | null;
  createdAt: string;
  createdBy: string | null;
};

export type SubtitleVersion = {
  id: string;
  kind: SubtitleVersionKind;
  language: SubtitleTrackLanguage;
  status: SubtitleVersionStatus;
  error: string | null;
  origin: {
    type: SubtitleOriginType;
    sourceVersionId: string | null;
    sourceRevisionId: string | null;
    sourceKind: SubtitleVersionKind | null;
    provider: string | null;
    model: string | null;
  };
  currentRevisionId: string | null;
  revisions: SubtitleRevision[];
  job: {
    type: "TRANSCRIPTION" | "TRANSLATION";
    provider: string;
    providerJobId: string | null;
    startedAt: string;
    heartbeatAt: string;
    progress: { completed: number; total: number } | null;
  } | null;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
};

export type WebinarSubtitleState = {
  schemaVersion: 1;
  stateVersion: number;
  versions: SubtitleVersion[];
  activeVersionIds: Record<SubtitleTrackLanguage, string | null>;
  legacyTracks: Array<{
    language: string;
    storageKey: string;
    etag: string | null;
    lastModified: string | null;
    registeredVersionId: string | null;
  }>;
  migratedAt: string | null;
};

export type WebinarPublicationStatus = "DRAFT" | "PUBLISHED";
export type WebinarAudience = "ALL_MEMBERS" | "INDIVIDUALS" | "MEMBERSHIP_TYPES";
export type MembershipCategory =
  | "Specialist"
  | "Professional"
  | "Trainer"
  | "Business"
  | "Brand";

export type WebinarAccessSettings = {
  audience: WebinarAudience;
  membershipTypes: MembershipCategory[];
  allowTeamMembers: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
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
  publicationStatus: WebinarPublicationStatus;
  publishedAt: string | null;
  access: WebinarAccessSettings;
  subtitleSummary: {
    versionCount: number;
    processingCount: number;
    activeLanguages: SubtitleTrackLanguage[];
  };
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

export type AdminWebinarDetail = AdminWebinar & {
  storage: { video: WebinarStoredObject | null };
  subtitles: WebinarSubtitleState;
  membershipCategories: Array<{
    value: MembershipCategory;
    applicantType: string;
  }>;
};

export type WebinarSubtitleDocument = {
  versionId: string;
  revisionId: string;
  etag: string | null;
  text: string;
};
