import crypto from "crypto";
import { requireDb } from "@/lib/db";
import { appendNotificationReadBy, deleteCanonicalNotification, insertCanonicalNotification, listCanonicalNotifications } from "./notification.repository";
import { sendCampaignEmails } from "./email.service";

type DbClient = ReturnType<typeof requireDb>;

function normalizeEmails(emails: string[]) {
  return [...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean))];
}

export async function sendEmailCampaign(db: DbClient, input: {
  subject: string;
  html: string;
  emails: string[];
}) {
  const emails = normalizeEmails(input.emails);
  if (emails.length === 0) {
    throw new Error("No valid recipient emails provided.");
  }

  const result = await sendCampaignEmails({
    subject: input.subject,
    html: input.html,
    emails,
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  await insertCanonicalNotification(db, {
    id: crypto.randomUUID(),
    title: input.subject,
    message: input.html,
    type: "EMAIL",
    visibility: "TARGETED",
    recipients: { emails },
    metadata: {
      delivery: "email_campaign",
      deliveryStatus: "sent",
    },
  });

  return { count: emails.length };
}

export async function createDashboardNotification(db: DbClient, input: {
  title: string;
  description: string;
  emails: string[];
  ctaLabel?: string | null;
  ctaUrl?: string | null;
}) {
  const emails = normalizeEmails(input.emails);
  if (emails.length === 0) {
    throw new Error("No valid recipient emails provided.");
  }

  await insertCanonicalNotification(db, {
    id: crypto.randomUUID(),
    title: input.title,
    message: input.description,
    type: "DASHBOARD",
    visibility: emails.length === 1 ? "INDIVIDUAL" : "TARGETED",
    recipients: { emails },
    metadata: {
      ctaLabel: input.ctaLabel ?? null,
      ctaUrl: input.ctaUrl ?? null,
      readBy: [],
    },
  });

  return { count: emails.length };
}

export async function listEmailLogs(db: DbClient) {
  const logs = await listCanonicalNotifications(db, { type: "EMAIL", limit: 50 });
  return logs.map((record: any) => ({
    id: record.id,
    to: Array.isArray((record.recipients as Record<string, unknown>)?.emails)
      ? String(((record.recipients as Record<string, unknown>).emails as unknown[])[0] ?? "")
      : "",
    subject: record.title,
    createdAt: record.createdAt,
  }));
}

export async function removeEmailLog(db: DbClient, id: string) {
  return deleteCanonicalNotification(db, id);
}

export async function markNotificationsRead(db: DbClient, params: {
  notificationIds: string[];
  email: string;
}) {
  const updatedIds: string[] = [];

  for (const id of params.notificationIds) {
    const updated = await appendNotificationReadBy(db, { id, email: params.email });
    if (updated) {
      updatedIds.push(updated.id);
    }
  }

  return updatedIds;
}
