import { requestJson } from "../../shared/utils/admin-request";
import type {
  AdminWebinarDetail,
  AdminWebinar,
  SubtitleLanguage,
  WebinarImportOption,
  WebinarListResponse,
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
  return requestJson<AdminWebinarDetail>(
    `/api/admin/webinars/${encodeURIComponent(id)}`,
    { cache: "no-store", signal },
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

export async function getWebinarSubtitle(
  id: string,
  language: SubtitleLanguage,
  signal?: AbortSignal,
) {
  return requestJson<WebinarSubtitleDocument>(
    `/api/admin/webinars/${encodeURIComponent(id)}/subtitles?language=${language}`,
    { cache: "no-store", signal },
    "Could not load the subtitle track.",
  );
}

export async function saveWebinarSubtitle(input: {
  id: string;
  language: SubtitleLanguage;
  vtt: string;
  expectedEtag: string | null;
}) {
  return requestJson<{ key: string; etag: string | null }>(
    `/api/admin/webinars/${encodeURIComponent(input.id)}/subtitles`,
    {
      body: JSON.stringify({
        language: input.language,
        vtt: input.vtt,
        expectedEtag: input.expectedEtag,
      }),
      headers: { "Content-Type": "application/json" },
      method: "PUT",
    },
    "Could not save subtitles.",
  );
}

export async function createEnglishTestTrack(id: string) {
  return requestJson<{ outcome: "created"; key: string; etag: string | null }>(
    `/api/admin/webinars/${encodeURIComponent(id)}/translate-english`,
    { body: "{}", headers: { "Content-Type": "application/json" }, method: "POST" },
    "Could not create the English test track.",
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
