import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreWebinars } from "@/lib/schema";
import type { WebinarStatus, WebinarZoomMetadata } from "./webinar.types";

type DbClient = ReturnType<typeof requireDb>;

export async function listWebinars(
  db: DbClient,
  input: {
    from?: Date | null;
    to?: Date | null;
    page: number;
    pageSize: number;
    query?: string | null;
    status?: WebinarStatus | null;
  },
) {
  const conditions: SQL[] = [];
  if (input.from) conditions.push(gte(coreWebinars.recordedAt, input.from));
  if (input.to) conditions.push(lte(coreWebinars.recordedAt, input.to));
  if (input.query)
    conditions.push(ilike(coreWebinars.title, `%${input.query}%`));
  if (input.status) conditions.push(eq(coreWebinars.status, input.status));
  const where = conditions.length ? and(...conditions) : undefined;
  const offset = (input.page - 1) * input.pageSize;

  const [items, countRows] = await Promise.all([
    db
      .select()
      .from(coreWebinars)
      .where(where)
      .orderBy(desc(coreWebinars.recordedAt), desc(coreWebinars.createdAt))
      .limit(input.pageSize)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(coreWebinars)
      .where(where),
  ]);

  return { items, total: Number(countRows[0]?.total || 0) };
}

export async function findWebinarById(db: DbClient, id: string) {
  const [record] = await db
    .select()
    .from(coreWebinars)
    .where(eq(coreWebinars.id, id))
    .limit(1);
  return record ?? null;
}

export async function findWebinarByZoomUuid(
  db: DbClient,
  zoomMeetingUuid: string,
) {
  const [record] = await db
    .select()
    .from(coreWebinars)
    .where(eq(coreWebinars.zoomMeetingUuid, zoomMeetingUuid))
    .limit(1);
  return record ?? null;
}

export async function upsertAvailableWebinar(
  db: DbClient,
  input: {
    title: string;
    zoomMeetingId: string;
    zoomMeetingUuid: string;
    recordedAt: Date;
    durationSeconds: number;
    transcriptAvailable: boolean;
    zoomMetadata: WebinarZoomMetadata;
  },
) {
  const existing = await findWebinarByZoomUuid(db, input.zoomMeetingUuid);
  if (existing) {
    const [updated] = await db
      .update(coreWebinars)
      .set({
        title: input.title,
        zoomMeetingId: input.zoomMeetingId,
        recordedAt: input.recordedAt,
        durationSeconds: input.durationSeconds,
        transcriptStatus:
          existing.transcriptStatus === "IMPORTED" ||
          existing.transcriptStatus === "FAILED"
            ? existing.transcriptStatus
            : input.transcriptAvailable
              ? "AVAILABLE"
              : "NOT_AVAILABLE",
        zoomMetadata: {
          ...input.zoomMetadata,
          importError:
            (existing.zoomMetadata as WebinarZoomMetadata | null)
              ?.importError || null,
        },
        updatedAt: new Date(),
      })
      .where(eq(coreWebinars.id, existing.id))
      .returning();
    return { record: updated ?? existing, created: false };
  }

  const [created] = await db
    .insert(coreWebinars)
    .values({
      title: input.title,
      zoomMeetingId: input.zoomMeetingId,
      zoomMeetingUuid: input.zoomMeetingUuid,
      recordedAt: input.recordedAt,
      durationSeconds: input.durationSeconds,
      transcriptStatus: input.transcriptAvailable
        ? "AVAILABLE"
        : "NOT_AVAILABLE",
      zoomMetadata: input.zoomMetadata,
    })
    .returning();

  return { record: created, created: true };
}

export async function updateWebinar(
  db: DbClient,
  id: string,
  values: Partial<{
    status: WebinarStatus;
    transcriptStatus: "AVAILABLE" | "IMPORTED" | "NOT_AVAILABLE" | "FAILED";
    zoomRecordingFileId: string | null;
    videoR2Key: string | null;
    zoomMetadata: WebinarZoomMetadata;
  }>,
) {
  const [record] = await db
    .update(coreWebinars)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(coreWebinars.id, id))
    .returning();
  return record ?? null;
}

/**
 * Compare-and-set write of the subtitle registry. The Neon HTTP driver has no
 * interactive transactions, so concurrent writers (a finishing AI job and an
 * admin save) are serialized by the `stateVersion` counter inside the JSONB.
 * `updated_at` is intentionally untouched: the import lifecycle uses it to
 * detect stale imports.
 */
export async function compareAndSetSubtitleState(
  db: DbClient,
  input: {
    id: string;
    expectedStateVersion: number;
    state: Record<string, unknown>;
  },
) {
  const [record] = await db
    .update(coreWebinars)
    .set({ subtitleVersions: input.state })
    .where(
      and(
        eq(coreWebinars.id, input.id),
        sql`coalesce((${coreWebinars.subtitleVersions}->>'stateVersion')::int, 0) = ${input.expectedStateVersion}`,
      ),
    )
    .returning();
  return record ?? null;
}

export async function updateWebinarPublication(
  db: DbClient,
  id: string,
  values: {
    publicationStatus?: "DRAFT" | "PUBLISHED";
    publishedAt?: Date | null;
    accessSettings?: Record<string, unknown>;
  },
) {
  const [record] = await db
    .update(coreWebinars)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(coreWebinars.id, id))
    .returning();
  return record ?? null;
}

export async function claimWebinarImport(
  db: DbClient,
  input: {
    id: string;
    recordingFileId: string;
    staleBefore: Date;
    zoomMetadata: WebinarZoomMetadata;
  },
) {
  const [record] = await db
    .update(coreWebinars)
    .set({
      status: "IMPORTING",
      zoomRecordingFileId: input.recordingFileId,
      zoomMetadata: { ...input.zoomMetadata, importError: null },
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(coreWebinars.id, input.id),
        or(
          inArray(coreWebinars.status, ["AVAILABLE", "FAILED"]),
          and(
            eq(coreWebinars.status, "IMPORTING"),
            lt(coreWebinars.updatedAt, input.staleBefore),
          ),
        ),
      ),
    )
    .returning();

  return record ?? null;
}
