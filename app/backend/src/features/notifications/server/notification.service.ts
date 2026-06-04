import crypto from "crypto";
import { requireDb } from "@/lib/db";
import { createLegacyDashboardNotifications, deleteLegacyEmailLog, insertCanonicalNotification, listLegacyEmailLogs, logEmails } from "./notification.repository";
import { sendCampaignEmails } from "./email.service";

type DbClient = ReturnType<typeof requireDb>;

function normalizeEmails(emails: string[]) {
  return [...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean))];
}

function isMissingCanonicalTableError(error: unknown) {
  return error instanceof Error && error.message.includes('relation "ibpa.');
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

  await logEmails(db, {
    emails,
    subject: input.subject,
    body: input.html,
    status: result.error ? "failed" : "sent",
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  try {
    await insertCanonicalNotification(db, {
      id: crypto.randomUUID(),
      title: input.subject,
      message: input.html,
      type: "EMAIL",
      visibility: "TARGETED",
      recipients: { emails },
      metadata: { delivery: "email_campaign" },
    });
  } catch (error) {
    if (!isMissingCanonicalTableError(error)) {
      throw error;
    }
  }

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

  await createLegacyDashboardNotifications(db, {
    title: input.title,
    description: input.description,
    emails,
    ctaLabel: input.ctaLabel ?? null,
    ctaUrl: input.ctaUrl ?? null,
  });

  try {
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
      },
    });
  } catch (error) {
    if (!isMissingCanonicalTableError(error)) {
      throw error;
    }
  }

  return { count: emails.length };
}

export async function listEmailLogs(db: DbClient) {
  return listLegacyEmailLogs(db);
}

export async function removeEmailLog(db: DbClient, id: string) {
  return deleteLegacyEmailLog(db, id);
}
