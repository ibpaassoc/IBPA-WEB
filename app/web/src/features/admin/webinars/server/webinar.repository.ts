import { requestJson } from "../../shared/utils/admin-request";
import type {
  AdminWebinarDetail,
  AdminWebinar,
  SubtitleTrackLanguage,
  WebinarAccessSettings,
  WebinarImportOption,
  WebinarListResponse,
  WebinarPublicationStatus,
  WebinarSubtitleDocument,
} from "../types/webinar.types";

export async function listWebinars(search: string, signal?: AbortSignal) {
  return requestJson<WebinarListResponse>(
    `/api/admin/webinars${search}`,
    { cache: "no-store", signal },
    "Could not load webinars.",
  );
}

export async function syncZoomRecordings(input: { from: string; to: string }) {
  return requestJson<{
    created: number;
    discovered: number;
    pages: number;
    updated: number;
    truncated: boolean;
  }>(
    "/api/admin/webinars/sync",
    {
      body: JSON.stringify(input),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    "Could not sync Zoom recordings.",
  );
}

export async function getImportOptions(id: string) {
  return requestJson<{ webinarId: string; files: WebinarImportOption[] }>(
    `/api/admin/webinars/${encodeURIComponent(id)}/import-options`,
    { cache: "no-store" },
    "Could not inspect Zoom recording files.",
  );
}

export async function importWebinarRecording(id: string, recordingFileId: string) {
  return requestJson<{ outcome: "started" | "importing" | "imported"; webinar?: AdminWebinar }>(
    `/api/admin/webinars/${encodeURIComponent(id)}/import`,
    {
      body: JSON.stringify({ recordingFileId }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    "Could not start the webinar import.",
  );
}

export async function getWebinar(id: string, signal?: AbortSignal) {
  // Always fresh: subtitle jobs update this record in the background, so the
  // shared admin read cache must not serve it (a signal opts out of caching).
  return requestJson<AdminWebinarDetail>(
    `/api/admin/webinars/${encodeURIComponent(id)}`,
    { cache: "no-store", signal: signal ?? new AbortController().signal },
    "Could not load the webinar.",
  );
}

export async function getWebinarPlayback(id: string, signal?: AbortSignal) {
  return requestJson<{ url: string; expiresIn: number }>(
    `/api/admin/webinars/${encodeURIComponent(id)}/playback`,
    { cache: "no-store", signal },
    "Could not prepare video playback.",
  );
}

export async function getSubtitleVersionContent(
  id: string,
  versionId: string,
  options: { revisionId?: string | null; signal?: AbortSignal } = {},
) {
  const search = options.revisionId
    ? `?revisionId=${encodeURIComponent(options.revisionId)}`
    : "";
  return requestJson<WebinarSubtitleDocument>(
    `/api/admin/webinars/${encodeURIComponent(id)}/subtitle-versions/${encodeURIComponent(versionId)}/content${search}`,
    { cache: "no-store", signal: options.signal ?? new AbortController().signal },
    "Could not load the subtitle version.",
  );
}

export async function saveSubtitleRevision(input: {
  id: string;
  versionId: string;
  vtt: string;
  expectedRevisionId: string | null;
}) {
  return requestJson<{
    outcome: "saved";
    versionId: string;
    revisionId: string;
    createdVersion: boolean;
  }>(
    `/api/admin/webinars/${encodeURIComponent(input.id)}/subtitle-versions/${encodeURIComponent(input.versionId)}/revisions`,
    {
      body: JSON.stringify({
        vtt: input.vtt,
        expectedRevisionId: input.expectedRevisionId,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    "Could not save subtitles.",
  );
}

export async function restoreSubtitleRevision(input: {
  id: string;
  versionId: string;
  revisionId: string;
  expectedRevisionId: string | null;
}) {
  return requestJson<{ outcome: "saved"; revisionId: string }>(
    `/api/admin/webinars/${encodeURIComponent(input.id)}/subtitle-versions/${encodeURIComponent(input.versionId)}/restore`,
    {
      body: JSON.stringify({
        revisionId: input.revisionId,
        expectedRevisionId: input.expectedRevisionId,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    "Could not restore the revision.",
  );
}

export async function setMemberSubtitleTrack(input: {
  id: string;
  language: SubtitleTrackLanguage;
  versionId: string | null;
}) {
  return requestJson<{
    outcome: "saved";
    activeVersionIds: Record<SubtitleTrackLanguage, string | null>;
  }>(
    `/api/admin/webinars/${encodeURIComponent(input.id)}/subtitle-tracks`,
    {
      body: JSON.stringify({ language: input.language, versionId: input.versionId }),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    },
    "Could not update the member subtitle track.",
  );
}

export async function generateRussianTranscript(id: string) {
  return requestJson<{ outcome: "started" | "in-progress"; versionId: string }>(
    `/api/admin/webinars/${encodeURIComponent(id)}/subtitle-versions/russian-ai`,
    { body: "{}", headers: { "Content-Type": "application/json" }, method: "POST" },
    "Could not start the Russian AI transcript.",
  );
}

export async function retrySubtitleVersion(id: string, versionId: string) {
  return requestJson<{ outcome: "started"; versionId: string }>(
    `/api/admin/webinars/${encodeURIComponent(id)}/subtitle-versions/${encodeURIComponent(versionId)}/retry`,
    { body: "{}", headers: { "Content-Type": "application/json" }, method: "POST" },
    "Could not retry the subtitle job.",
  );
}

export async function generateEnglishTranslation(
  id: string,
  sourceVersionId: string,
) {
  return requestJson<{ outcome: "started" | "in-progress"; versionId: string }>(
    `/api/admin/webinars/${encodeURIComponent(id)}/subtitle-versions/english-ai`,
    {
      body: JSON.stringify({ sourceVersionId }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    "Could not start the English translation.",
  );
}

export type WebinarAccessInput = Pick<
  WebinarAccessSettings,
  "audience" | "membershipTypes" | "allowTeamMembers"
>;

type PublicationResponse = {
  publicationStatus: WebinarPublicationStatus;
  publishedAt: string | null;
  access: WebinarAccessSettings;
};

export async function publishWebinar(id: string, access: WebinarAccessInput) {
  return requestJson<PublicationResponse>(
    `/api/admin/webinars/${encodeURIComponent(id)}/publish`,
    {
      body: JSON.stringify({ access }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    },
    "Could not publish the webinar.",
  );
}

export async function unpublishWebinar(id: string) {
  return requestJson<PublicationResponse>(
    `/api/admin/webinars/${encodeURIComponent(id)}/unpublish`,
    { body: "{}", headers: { "Content-Type": "application/json" }, method: "POST" },
    "Could not move the webinar to draft.",
  );
}

export async function updateWebinarAccess(id: string, access: WebinarAccessInput) {
  return requestJson<PublicationResponse>(
    `/api/admin/webinars/${encodeURIComponent(id)}/access`,
    {
      body: JSON.stringify({ access }),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    },
    "Could not save access settings.",
  );
}
