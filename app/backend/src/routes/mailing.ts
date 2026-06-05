import { Router } from "express";
import { requireDb } from "../lib/db";
import { adminClerkMiddleware, requireAdminAccess } from "../services/admin";
import { createDashboardNotification, listEmailLogs, removeEmailLog, sendEmailCampaign } from "../features/notifications/server/notification.service";

export const mailingRouter = Router();

mailingRouter.post("/send", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const { subject, html, emails } = req.body;

  if (!subject || !html || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "Missing required fields: subject, html, emails (array)" });
  }

  try {
    const db = requireDb();
    const result = await sendEmailCampaign(db, {
      subject,
      html,
      emails,
    });

    res.json({ success: true, count: result.count });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

    console.error("Mailing API Error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to process mailing request" });
  }
});

mailingRouter.get("/email-logs", adminClerkMiddleware, requireAdminAccess, async (_req, res) => {
  try {
    const db = requireDb();
    const logs = await listEmailLogs(db);
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
    await removeEmailLog(db, id);
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
    const result = await createDashboardNotification(db, {
      title,
      description,
      emails,
      ctaLabel: ctaLabel || null,
      ctaUrl: ctaUrl || null,
    });

    res.json({ success: true, count: result.count });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

    console.error("Dashboard notification API Error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to create dashboard notifications" });
  }
});
