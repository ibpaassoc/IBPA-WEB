import { randomUUID } from "node:crypto";
import { requireDb } from "@/lib/db";
import type { CoreWebinar } from "@/lib/schema";
import {
  createPresignedR2GetUrl,
  getTextFromR2,
  headR2Object,
  putTextToR2,
  uploadStreamToR2,
} from "./r2-storage";
import {
  getZoomMeetingRecordings,
  listZoomUserRecordings,
  listZoomUsers,
  openZoomRecordingDownload,
  type ZoomRecordingFile,
  type ZoomRecordingMeeting,
} from "./zoom-recordings";
import {
  claimWebinarImport,
  findWebinarById,
  listWebinars,
  updateWebinar,
  upsertAvailableWebinar,
} from "./webinar.repository";
import {
  subtitleLanguages,
  transcriptStatuses,
  webinarStatuses,
  type SubtitleLanguage,
  type WebinarStatus,
  type WebinarZoomMetadata,
} from "./webinar.types";
import { parseWebinarVtt, serializeWebinarVtt } from "./webinar-vtt";
import {
  ensureWebinarSubtitleState,
  registerImportedSourceSubtitles,
} from "./webinar-subtitles.service";
import {
  legacySubtitleKey,
  normalizeSubtitleState,
  type WebinarSubtitleState,
} from "./webinar-subtitle-state";
import {
  membershipCategoryOptions,
  normalizeWebinarAccessSettings,
} from "./webinar-access";

const MAX_USER_PAGES = 50;
const MAX_RECORDING_PAGES_PER_USER = 50;
const MAX_VTT_BYTES = 4 * 1024 * 1024;
const STALE_IMPORT_MS = 6 * 60 * 60 * 1000;
const activeImports = new Set<string>();

function isCompleted(file: ZoomRecordingFile) {
  return !file.status || file.status.toLowerCase() === "completed";
}

function isMp4(file: ZoomRecordingFile) {
  return (
    isCompleted(file) &&
    (file.file_type || file.file_extension || "").toUpperCase() === "MP4"
  );
}

function isTranscript(file: ZoomRecordingFile) {
  const fileType = (file.file_type || "").toUpperCase();
  const extension = (file.file_extension || "").toUpperCase();
  return (
    isCompleted(file) && (fileType === "TRANSCRIPT" || extension === "VTT")
  );
}

function safeZoomFiles(meeting: ZoomRecordingMeeting) {
  return (meeting.recording_files || []).map((file) => ({
    id: file.id,
    recording_start: file.recording_start,
    recording_end: file.recording_end,
    file_type: file.file_type,
    file_extension: file.file_extension,
    file_size: file.file_size,
    status: file.status,
    recording_type: file.recording_type,
  }));
}

function toZoomMetadata(meeting: ZoomRecordingMeeting): WebinarZoomMetadata {
  const transcript = (meeting.recording_files || []).find(isTranscript);
  return {
    hostId: meeting.host_id,
    hostEmail: meeting.host_email,
    timezone: meeting.timezone,
    totalSize: meeting.total_size,
    recordingFiles: safeZoomFiles(meeting),
    transcriptSourceRecordingFileId: transcript?.id || null,
    transcriptLanguage: transcript ? "ru" : undefined,
  };
}

function parseDateOnly(value: string, edge: "start" | "end") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Dates must use YYYY-MM-DD format.");
  }
  const parsed = new Date(
    `${value}T${edge === "start" ? "00:00:00.000" : "23:59:59.999"}Z`,
  );
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new Error("Choose a valid recording date.");
  }
  return parsed;
}

function positiveInteger(value: number | undefined, fallback: number) {
  return Number.isFinite(value) && Number(value) > 0
    ? Math.floor(Number(value))
    : fallback;
}

export async function syncZoomWebinars(input: { from: string; to: string }) {
  const from = parseDateOnly(input.from, "start");
  const to = parseDateOnly(input.to, "end");
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    throw new Error("Choose a valid recording date range.");
  }
  if (to.getTime() - from.getTime() > 31 * 24 * 60 * 60 * 1000) {
    throw new Error(
      "Zoom recording sync supports a maximum date range of 31 days.",
    );
  }

  const db = requireDb();
  let userToken: string | null = null;
  let userPages = 0;
  let usersScanned = 0;
  let pages = 0;
  let created = 0;
  let updated = 0;
  let discovered = 0;

  let truncated = false;

  do {
    const userPage = await listZoomUsers({
      pageSize: 300,
      nextPageToken: userToken,
    });
    userPages += 1;
    usersScanned += userPage.users.length;

    for (const user of userPage.users) {
      let recordingToken: string | null = null;
      let userRecordingPages = 0;

      do {
        const page = await listZoomUserRecordings({
          userId: user.id,
          from: input.from,
          to: input.to,
          pageSize: 300,
          nextPageToken: recordingToken,
        });
        pages += 1;
        userRecordingPages += 1;
        discovered += page.meetings.length;

        for (const meeting of page.meetings) {
          const normalizedMeeting = {
            ...meeting,
            host_id: meeting.host_id || user.id,
            host_email: meeting.host_email || user.email,
          };
          const recordedAt = new Date(
            meeting.start_time || `${input.from}T00:00:00Z`,
          );
          const result = await upsertAvailableWebinar(db, {
            title: meeting.topic?.trim() || "Untitled Zoom recording",
            zoomMeetingId: String(meeting.id),
            zoomMeetingUuid: meeting.uuid,
            recordedAt: Number.isNaN(recordedAt.getTime()) ? from : recordedAt,
            durationSeconds: Math.max(
              0,
              Math.round(Number(meeting.duration || 0) * 60),
            ),
            transcriptAvailable: (meeting.recording_files || []).some(
              isTranscript,
            ),
            zoomMetadata: toZoomMetadata(normalizedMeeting),
          });
          if (result.created) created += 1;
          else updated += 1;
        }

        recordingToken = page.next_page_token || null;
      } while (
        recordingToken &&
        userRecordingPages < MAX_RECORDING_PAGES_PER_USER
      );

      if (recordingToken) truncated = true;
    }

    userToken = userPage.next_page_token || null;
  } while (userToken && userPages < MAX_USER_PAGES);

  if (userToken) truncated = true;

  return {
    created,
    discovered,
    pages,
    updated,
    truncated,
    userPages,
    usersScanned,
  };
}

function subtitleSummary(state: WebinarSubtitleState) {
  return {
    versionCount: state.versions.length,
    processingCount: state.versions.filter(
      (version) => version.status === "PROCESSING",
    ).length,
    activeLanguages: (["ru", "en"] as const).filter(
      (language) => state.activeVersionIds[language],
    ),
  };
}

/** Admin response shape: raw JSONB columns are replaced by normalized views. */
function toAdminWebinar(record: CoreWebinar, state?: WebinarSubtitleState) {
  const { subtitleVersions, accessSettings, ...rest } = record;
  return {
    ...rest,
    access: normalizeWebinarAccessSettings(accessSettings),
    subtitleSummary: subtitleSummary(
      state ?? normalizeSubtitleState(subtitleVersions),
    ),
  };
}

export async function getWebinarList(input: {
  from?: string | null;
  to?: string | null;
  page?: number;
  pageSize?: number;
  query?: string | null;
  status?: string | null;
}) {
  const page = positiveInteger(input.page, 1);
  const pageSize = Math.min(
    50,
    Math.max(5, positiveInteger(input.pageSize, 20)),
  );
  const status = webinarStatuses.includes(input.status as WebinarStatus)
    ? (input.status as WebinarStatus)
    : null;
  const result = await listWebinars(requireDb(), {
    from: input.from ? parseDateOnly(input.from, "start") : null,
    to: input.to ? parseDateOnly(input.to, "end") : null,
    page,
    pageSize,
    query: input.query?.trim() || null,
    status,
  });
  return {
    ...result,
    items: result.items.map((item: CoreWebinar) => toAdminWebinar(item)),
    page,
    pageCount: Math.max(1, Math.ceil(result.total / pageSize)),
    pageSize,
  };
}

export async function getWebinarDetail(id: string) {
  const found = await findWebinarById(requireDb(), id);
  if (!found) return null;
  const { webinar: record, state } = await ensureWebinarSubtitleState(found);
  const [video, tracks] = await Promise.all([
    record.videoR2Key ? headR2Object(record.videoR2Key) : Promise.resolve(null),
    Promise.all(
      subtitleLanguages.map(async (language) => ({
        language,
        object: await headR2Object(subtitleKey(record.id, language)),
      })),
    ),
  ]);
  return {
    ...toAdminWebinar(record, state),
    subtitles: state,
    membershipCategories: membershipCategoryOptions,
    storage: { video },
    tracks: tracks.map(({ language, object }) => ({
      language,
      ...object,
      exists: Boolean(object),
    })),
  };
}

export async function getWebinarImportOptions(id: string) {
  const webinar = await findWebinarById(requireDb(), id);
  if (!webinar) return null;
  const meeting = await getZoomMeetingRecordings(webinar.zoomMeetingUuid);
  return {
    webinarId: id,
    files: (meeting.recording_files || []).filter(isMp4).map((file) => ({
      id: file.id,
      recordingType: file.recording_type || "video",
      fileSize: Number(file.file_size || 0),
      recordingStart: file.recording_start || null,
      recordingEnd: file.recording_end || null,
    })),
  };
}

export async function startWebinarImport(id: string, recordingFileId: string) {
  const db = requireDb();
  const webinar = await findWebinarById(db, id);
  if (!webinar) return { outcome: "not-found" as const };
  if (
    webinar.status === "IMPORTED" &&
    webinar.zoomRecordingFileId === recordingFileId &&
    webinar.videoR2Key
  ) {
    return { outcome: "imported" as const, webinar };
  }
  if (webinar.status === "IMPORTED") {
    return {
      outcome: "conflict" as const,
      message: "This webinar already has an imported recording.",
    };
  }
  if (activeImports.has(id)) {
    return { outcome: "importing" as const, webinar };
  }
  const staleBefore = new Date(Date.now() - STALE_IMPORT_MS);
  if (webinar.status === "IMPORTING" && webinar.updatedAt >= staleBefore) {
    return { outcome: "importing" as const, webinar };
  }

  const meeting = await getZoomMeetingRecordings(webinar.zoomMeetingUuid);
  const selected = (meeting.recording_files || []).find(
    (file) => file.id === recordingFileId && isMp4(file),
  );
  if (!selected?.download_url) {
    return {
      outcome: "invalid-file" as const,
      message: "The selected Zoom MP4 is unavailable.",
    };
  }

  const metadata = toZoomMetadata(meeting);
  const claimed = await claimWebinarImport(db, {
    id,
    recordingFileId: selected.id,
    staleBefore,
    zoomMetadata: metadata,
  });
  if (!claimed) {
    const current = await findWebinarById(db, id);
    if (
      current?.status === "IMPORTED" &&
      current.zoomRecordingFileId === recordingFileId &&
      current.videoR2Key
    ) {
      return { outcome: "imported" as const, webinar: current };
    }
    return current?.status === "IMPORTED"
      ? {
          outcome: "conflict" as const,
          message: "This webinar already has an imported recording.",
        }
      : { outcome: "importing" as const, webinar: current || webinar };
  }

  activeImports.add(id);
  void runWebinarImport(claimed, meeting, selected)
    .catch((error) => {
      console.error("[Webinar import] Background job failed", {
        webinarId: id,
        error: error instanceof Error ? error.message : String(error),
      });
    })
    .finally(() => activeImports.delete(id));
  return { outcome: "started" as const };
}

async function runWebinarImport(
  webinar: CoreWebinar,
  meeting: ZoomRecordingMeeting,
  selected: ZoomRecordingFile,
) {
  const db = requireDb();
  const videoKey = `webinars/${webinar.id}/video/${selected.id}.mp4`;
  const metadata = toZoomMetadata(meeting);

  try {
    const videoResponse = await openZoomRecordingDownload(
      selected.download_url!,
    );
    await uploadStreamToR2({
      key: videoKey,
      body: videoResponse.body!,
      contentLength:
        Number(
          selected.file_size || videoResponse.headers.get("content-length"),
        ) || null,
      contentType: videoResponse.headers.get("content-type") || "video/mp4",
      metadata: {
        "zoom-meeting-uuid": webinar.zoomMeetingUuid,
        "zoom-recording-file-id": selected.id,
      },
    });

    let transcriptStatus: "IMPORTED" | "NOT_AVAILABLE" | "FAILED" =
      "NOT_AVAILABLE";
    const transcript = (meeting.recording_files || []).find(isTranscript);
    if (transcript?.download_url) {
      try {
        const transcriptResponse = await openZoomRecordingDownload(
          transcript.download_url,
        );
        await uploadStreamToR2({
          key: legacySubtitleKey(webinar.id, "ru"),
          body: transcriptResponse.body!,
          contentLength:
            Number(
              transcript.file_size ||
                transcriptResponse.headers.get("content-length"),
            ) || null,
          contentType: "text/vtt; charset=utf-8",
          metadata: {
            "zoom-meeting-uuid": webinar.zoomMeetingUuid,
            "zoom-recording-file-id": transcript.id,
            language: "ru",
          },
        });
        transcriptStatus = "IMPORTED";
      } catch (error) {
        console.error("[Webinar import] Transcript upload failed", {
          webinarId: webinar.id,
          error: error instanceof Error ? error.message : String(error),
        });
        transcriptStatus = "FAILED";
      }
    }

    await updateWebinar(db, webinar.id, {
      status: "IMPORTED",
      transcriptStatus,
      zoomRecordingFileId: selected.id,
      videoR2Key: videoKey,
      zoomMetadata: { ...metadata, importError: null },
    });

    if (transcriptStatus === "IMPORTED" && transcript) {
      try {
        await registerImportedSourceSubtitles({
          webinarId: webinar.id,
          storageKey: legacySubtitleKey(webinar.id, "ru"),
          zoomRecordingFileId: transcript.id,
        });
      } catch (error) {
        // The transcript stays in R2; opening the webinar registers it lazily.
        console.error("[Webinar import] Source subtitle registration failed", {
          webinarId: webinar.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Recording import failed.";
    console.error("[Webinar import] Video import failed", {
      webinarId: webinar.id,
      error: message,
    });
    await updateWebinar(db, webinar.id, {
      status: "FAILED",
      zoomRecordingFileId: selected.id,
      zoomMetadata: { ...metadata, importError: message.slice(0, 500) },
    });
  }
}

export async function getWebinarPlayback(id: string) {
  const webinar = await findWebinarById(requireDb(), id);
  if (!webinar?.videoR2Key || webinar.status !== "IMPORTED") return null;
  return {
    expiresIn: 3600,
    url: await createPresignedR2GetUrl(webinar.videoR2Key, 3600),
  };
}

export async function getWebinarSubtitle(
  id: string,
  language: SubtitleLanguage,
) {
  const webinar = await findWebinarById(requireDb(), id);
  if (!webinar) return { outcome: "not-found" as const };
  const object = await getTextFromR2(subtitleKey(id, language));
  return object
    ? { outcome: "ok" as const, language, ...object }
    : { outcome: "missing" as const };
}

export async function saveWebinarSubtitle(input: {
  id: string;
  language: SubtitleLanguage;
  vtt: string;
  expectedEtag?: string | null;
}) {
  const webinar = await findWebinarById(requireDb(), input.id);
  if (!webinar) return null;
  if (Buffer.byteLength(input.vtt, "utf8") > MAX_VTT_BYTES) {
    throw new Error("Subtitle files must be smaller than 4 MB.");
  }
  parseWebinarVtt(input.vtt);
  return putTextToR2({
    key: subtitleKey(input.id, input.language),
    text: input.vtt,
    expectedEtag: input.expectedEtag,
  });
}

export async function createEnglishTestTrack(id: string) {
  const webinar = await findWebinarById(requireDb(), id);
  if (!webinar) return { outcome: "not-found" as const };
  const [russian, english] = await Promise.all([
    getTextFromR2(subtitleKey(id, "ru")),
    headR2Object(subtitleKey(id, "en")),
  ]);
  if (!russian) return { outcome: "missing-source" as const };
  if (english) return { outcome: "exists" as const };

  const copiedCues = parseWebinarVtt(russian.text).map((cue) => ({
    ...cue,
    id: cue.id || randomUUID(),
  }));
  const result = await putTextToR2({
    key: subtitleKey(id, "en"),
    text: serializeWebinarVtt(copiedCues),
    metadata: { source: "ru", translation: "test-copy" },
    requireAbsent: true,
  });
  return { outcome: "created" as const, ...result };
}

export function isSubtitleLanguage(value: unknown): value is SubtitleLanguage {
  return subtitleLanguages.includes(value as SubtitleLanguage);
}

export function isTranscriptStatus(value: unknown) {
  return transcriptStatuses.includes(
    value as (typeof transcriptStatuses)[number],
  );
}

function subtitleKey(webinarId: string, language: SubtitleLanguage) {
  return legacySubtitleKey(webinarId, language);
}
