import { Router } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { dashboardNotifications, emailLogs, requireDb } from "../lib/db";
import { SUPPORT_REPLY_TO, SUPPORT_SENDER, sendBatchEmail } from "../services/email";
import { adminClerkMiddleware, requireAdminAccess } from "../services/admin";

export const mailingRouter = Router();

async function ensureEmailLogsTable(db: ReturnType<typeof requireDb>) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "email_logs" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "to" text NOT NULL,
      "subject" text NOT NULL,
      "body" text NOT NULL,
      "status" text NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    )
  `);
}

async function logEmails(emails: string[], subject: string, body: string, status: string) {
  if (emails.length === 0) {
    return;
  }

  const db = requireDb();
  await ensureEmailLogsTable(db);
  await db.insert(emailLogs).values(
    emails.map((email) => ({
      to: email,
      subject,
      body,
      status,
    })),
  );
}

async function safeLogEmails(emails: string[], subject: string, body: string, status: string) {
  try {
    await logEmails(emails, subject, body, status);
  } catch (error) {
    console.error(`Failed to log ${status} emails:`, error);
  }
}

mailingRouter.post("/send", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const { subject, html, emails } = req.body;

  if (!subject || !html || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "Missing required fields: subject, html, emails (array)" });
  }

  const targetEmails = [...new Set((emails as string[]).map((email) => email.trim()).filter(Boolean))];

  if (targetEmails.length === 0) {
    return res.status(400).json({ error: "No valid recipient emails provided." });
  }

  try {
    // Resend Batch Sending API
    const batchData = targetEmails.map(email => ({
      from: SUPPORT_SENDER,
      to: [email],
      replyTo: SUPPORT_REPLY_TO,
      subject,
      html,
    }));

    // Resend free tier has a limit of 100 emails per batch request
    // We chunk the array into 100-size chunks
    const chunkedArr = [];
    for (let i = 0; i < batchData.length; i += 100) {
      chunkedArr.push(batchData.slice(i, i + 100));
    }

    for (const chunk of chunkedArr) {
      const { error } = await sendBatchEmail(chunk);
      if (error) {
        console.error("Resend Batch Error:", error);
        await safeLogEmails(targetEmails, subject, html, "failed");
        return res.status(500).json({ error: "Failed to send batch: " + error.message });
      }
    }

    await safeLogEmails(targetEmails, subject, html, "sent");

    console.log(`Successfully sent email campaign "${subject}" to ${targetEmails.length} recipients`);
    
    res.json({ success: true, count: targetEmails.length });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("Mailing API Error:", error);
    await safeLogEmails(targetEmails, subject, html, "failed");
    res.status(500).json({ error: "Failed to process mailing request" });
  }
});

mailingRouter.get("/email-logs", adminClerkMiddleware, requireAdminAccess, async (_req, res) => {
  try {
    const db = requireDb();
    await ensureEmailLogsTable(db);
    const logs = await db.select().from(emailLogs).orderBy(desc(emailLogs.createdAt)).limit(50);
    res.json(logs);
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("Email logs API Error:", error);
    res.status(500).json({ error: "Failed to load email logs" });
  }
});

mailingRouter.delete("/email-logs/:id", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!id) {
    return res.status(400).json({ error: "Missing email log id" });
  }

  try {
    const db = requireDb();
    await ensureEmailLogsTable(db);
    await db.delete(emailLogs).where(eq(emailLogs.id, id));
    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("Delete email log API Error:", error);
    res.status(500).json({ error: "Failed to delete email log" });
  }
});

mailingRouter.post("/notifications/send", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const { title, description, emails, ctaLabel, ctaUrl } = req.body;

  if (!title || !description || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "Missing required fields: title, description, emails (array)" });
  }

  try {
    const db = requireDb();
    const targetEmails = [...new Set((emails as string[]).map((email) => email.trim()).filter(Boolean))];

    if (targetEmails.length === 0) {
      return res.status(400).json({ error: "No valid recipient emails provided." });
    }

    await db.insert(dashboardNotifications).values(
      targetEmails.map((email) => ({
        email,
        title,
        description,
        ctaLabel: ctaLabel || null,
        ctaUrl: ctaUrl || null,
      })),
    );

    console.log(`Successfully created dashboard notification "${title}" for ${targetEmails.length} recipients`);
    res.json({ success: true, count: targetEmails.length });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("Dashboard notification API Error:", error);
    res.status(500).json({ error: "Failed to create dashboard notifications" });
  }
});
