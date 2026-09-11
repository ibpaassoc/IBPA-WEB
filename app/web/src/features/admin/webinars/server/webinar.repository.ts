import { requestJson } from "../../shared/utils/admin-request";
import type {
  AdminWebinar,
  WebinarImportOption,
  WebinarListResponse,
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
