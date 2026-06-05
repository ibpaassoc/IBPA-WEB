import { desc, eq, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreNotifications } from "@/lib/schema";

type DbClient = ReturnType<typeof requireDb>;

export async function insertCanonicalNotification(db: DbClient, input: {
  id: string;
  title: string;
  message: string;
  type: string;
  visibility: string;
  recipients: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) {
  const [existing] = await db.select().from(coreNotifications).where(eq(coreNotifications.id, input.id)).limit(1);

  if (existing) {
    const [updated] = await db
      .update(coreNotifications)
      .set({
        title: input.title,
        message: input.message,
        type: input.type,
        visibility: input.visibility,
        recipients: input.recipients,
        metadata: input.metadata ?? existing.metadata,
      })
      .where(eq(coreNotifications.id, input.id))
      .returning();

    return { record: updated ?? existing, created: false };
  }

  const [created] = await db
    .insert(coreNotifications)
    .values({
      id: input.id,
      title: input.title,
      message: input.message,
      type: input.type,
      visibility: input.visibility,
      recipients: input.recipients,
      metadata: input.metadata ?? {},
    })
    .returning();

  return { record: created, created: true };
}

export async function listCanonicalNotifications(db: DbClient, params?: {
  type?: string;
  limit?: number;
}) {
  let query = db
    .select()
    .from(coreNotifications)
    .orderBy(desc(coreNotifications.createdAt))
    .$dynamic();

  if (params?.type) {
    query = query.where(eq(coreNotifications.type, params.type));
  }

  return query.limit(params?.limit ?? 50);
}

export async function deleteCanonicalNotification(db: DbClient, id: string) {
  await db.delete(coreNotifications).where(eq(coreNotifications.id, id));
}

export async function appendNotificationReadBy(db: DbClient, params: {
  id: string;
  email: string;
}) {
  const [existing] = await db.select().from(coreNotifications).where(eq(coreNotifications.id, params.id)).limit(1);
  if (!existing) {
    return null;
  }

  const metadata = existing.metadata && typeof existing.metadata === "object" && !Array.isArray(existing.metadata)
    ? existing.metadata
    : {};
  const readBy = Array.isArray((metadata as Record<string, unknown>).readBy)
    ? ((metadata as Record<string, unknown>).readBy as unknown[]).filter((item): item is string => typeof item === "string")
    : [];
  const normalizedEmail = params.email.trim().toLowerCase();

  if (!readBy.includes(normalizedEmail)) {
    readBy.push(normalizedEmail);
  }

  const [updated] = await db
    .update(coreNotifications)
    .set({
      metadata: {
        ...metadata,
        readBy,
      },
    })
    .where(eq(coreNotifications.id, params.id))
    .returning();

  return updated ?? existing;
}
