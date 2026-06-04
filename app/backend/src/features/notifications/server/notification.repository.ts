import { desc, eq, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreNotifications, dashboardNotifications, emailLogs } from "@/lib/schema";

type DbClient = ReturnType<typeof requireDb>;

export async function ensureLegacyEmailLogsTable(db: DbClient) {
  await db.execute(sql`
    create table if not exists "email_logs" (
      "id" uuid primary key default gen_random_uuid() not null,
      "to" text not null,
      "subject" text not null,
      "body" text not null,
      "status" text not null,
      "created_at" timestamp default now() not null
    )
  `);
}

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

export async function createLegacyDashboardNotifications(db: DbClient, input: {
  title: string;
  description: string;
  emails: string[];
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}) {
  return db.insert(dashboardNotifications).values(
    input.emails.map((email) => ({
      email,
      title: input.title,
      description: input.description,
      ctaLabel: input.ctaLabel ?? null,
      ctaUrl: input.ctaUrl ?? null,
    })),
  );
}

export async function logEmails(db: DbClient, input: {
  emails: string[];
  subject: string;
  body: string;
  status: string;
}) {
  if (input.emails.length === 0) {
    return;
  }

  await ensureLegacyEmailLogsTable(db);
  await db.insert(emailLogs).values(
    input.emails.map((email) => ({
      to: email,
      subject: input.subject,
      body: input.body,
      status: input.status,
    })),
  );
}

export async function listLegacyEmailLogs(db: DbClient) {
  await ensureLegacyEmailLogsTable(db);
  return db.select().from(emailLogs).orderBy(desc(emailLogs.createdAt)).limit(50);
}

export async function deleteLegacyEmailLog(db: DbClient, id: string) {
  await ensureLegacyEmailLogsTable(db);
  await db.delete(emailLogs).where(eq(emailLogs.id, id));
}
