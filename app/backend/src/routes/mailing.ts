import { Router } from "express";
import { dashboardNotifications, requireDb } from "../lib/db";
import { resend, resendFrom } from "../services/email";
import { adminClerkMiddleware, requireAdminAccess } from "../services/admin";

export const mailingRouter = Router();

mailingRouter.post("/send", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const { subject, html, emails } = req.body;

  if (!subject || !html || !Array.isArray(emails) || emails.length === 0) {
    return res.status(400).json({ error: "Missing required fields: subject, html, emails (array)" });
  }

  try {
    const targetEmails = [...new Set(emails as string[])];

    // Resend Batch Sending API
    const batchData = targetEmails.map(email => ({
      from: resendFrom,
      to: [email],
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
      const { error } = await resend.batch.send(chunk);
      if (error) {
        console.error("Resend Batch Error:", error);
        return res.status(500).json({ error: "Failed to send batch: " + error.message });
      }
    }

    console.log(`Successfully sent email campaign "${subject}" to ${targetEmails.length} recipients`);
    
    res.json({ success: true, count: targetEmails.length });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("Mailing API Error:", error);
    res.status(500).json({ error: "Failed to process mailing request" });
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
