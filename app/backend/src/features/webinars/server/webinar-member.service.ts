import { and, desc, eq, isNotNull } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreWebinars, type CoreWebinar } from "@/lib/schema";
import { createPresignedR2GetUrl, getTextFromR2 } from "./r2-storage";
import {
  canViewerWatchWebinar,
  normalizeWebinarAccessSettings,
  type WebinarViewer,
} from "./webinar-access";
import {
  isSubtitleTrackLanguage,
  memberSubtitleTracks,
  normalizeSubtitleState,
} from "./webinar-subtitle-state";

/**
 * Member-facing webinars. Every function re-checks publication and access
 * rules server-side; responses never include admin data (lineage, revisions,
 * storage keys, access configuration, or Zoom metadata).
 */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PLAYBACK_URL_TTL_SECONDS = 3600;
const MAX_LISTED_WEBINARS = 200;

type DbClient = ReturnType<typeof requireDb>;

function isWatchable(webinar: CoreWebinar, viewer: WebinarViewer) {
  return (
    webinar.status === "IMPORTED" &&
    Boolean(webinar.videoR2Key) &&
    canViewerWatchWebinar({
      publicationStatus: webinar.publicationStatus,
      access: normalizeWebinarAccessSettings(webinar.accessSettings),
      viewer,
    })
  );
}

function toMemberWebinar(webinar: CoreWebinar) {
  const tracks = memberSubtitleTracks(
    normalizeSubtitleState(webinar.subtitleVersions),
  );
  return {
    id: webinar.id,
    title: webinar.title,
    recordedAt: webinar.recordedAt,
    durationSeconds: webinar.durationSeconds,
    publishedAt: webinar.publishedAt,
    subtitleLanguages: tracks.map((track) => track.language),
  };
}

export async function listMemberWebinars(
  viewer: WebinarViewer,
  db: DbClient = requireDb(),
) {
  const rows: CoreWebinar[] = await db
    .select()
    .from(coreWebinars)
    .where(
      and(
        eq(coreWebinars.publicationStatus, "PUBLISHED"),
        eq(coreWebinars.status, "IMPORTED"),
        isNotNull(coreWebinars.videoR2Key),
      ),
    )
    .orderBy(desc(coreWebinars.recordedAt))
    .limit(MAX_LISTED_WEBINARS);
  return rows
    .filter((webinar) => isWatchable(webinar, viewer))
    .map(toMemberWebinar);
}

type AccessResult =
  | { outcome: "not-found" }
  | { outcome: "forbidden" }
  | { outcome: "ok"; webinar: CoreWebinar };

async function loadForViewer(
  id: string,
  viewer: WebinarViewer,
  db: DbClient,
): Promise<AccessResult> {
  if (!UUID_PATTERN.test(id)) return { outcome: "not-found" };
  const [webinar] = await db
    .select()
    .from(coreWebinars)
    .where(eq(coreWebinars.id, id))
    .limit(1);
  // Drafts and unimported recordings look exactly like missing webinars.
  if (
    !webinar ||
    webinar.publicationStatus !== "PUBLISHED" ||
    webinar.status !== "IMPORTED" ||
    !webinar.videoR2Key
  ) {
    return { outcome: "not-found" };
  }
  return isWatchable(webinar, viewer)
    ? { outcome: "ok", webinar }
    : { outcome: "forbidden" };
}

export async function getMemberWebinar(
  id: string,
  viewer: WebinarViewer,
  db: DbClient = requireDb(),
) {
  const result = await loadForViewer(id, viewer, db);
  if (result.outcome !== "ok") return result;
  return { outcome: "ok" as const, webinar: toMemberWebinar(result.webinar) };
}

export async function getMemberWebinarPlayback(
  id: string,
  viewer: WebinarViewer,
  db: DbClient = requireDb(),
) {
  const result = await loadForViewer(id, viewer, db);
  if (result.outcome !== "ok") return result;
  return {
    outcome: "ok" as const,
    playback: {
      expiresIn: PLAYBACK_URL_TTL_SECONDS,
      url: await createPresignedR2GetUrl(
        result.webinar.videoR2Key!,
        PLAYBACK_URL_TTL_SECONDS,
      ),
    },
  };
}

export async function getMemberWebinarSubtitles(
  id: string,
  language: string,
  viewer: WebinarViewer,
  db: DbClient = requireDb(),
) {
  if (!isSubtitleTrackLanguage(language)) return { outcome: "missing" as const };
  const result = await loadForViewer(id, viewer, db);
  if (result.outcome !== "ok") return result;
  const track = memberSubtitleTracks(
    normalizeSubtitleState(result.webinar.subtitleVersions),
  ).find((item) => item.language === language);
  if (!track) return { outcome: "missing" as const };
  const object = await getTextFromR2(track.revision.storageKey);
  if (!object) return { outcome: "missing" as const };
  return {
    outcome: "ok" as const,
    subtitles: { language, text: object.text },
  };
}
