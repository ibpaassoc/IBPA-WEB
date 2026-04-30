import { Router } from "express";
import { adminNotificationEmail, resend, resendFrom } from "../services/email";
import { createRateLimiter, getClientAddress } from "../lib/rate-limit";

export const contactRouter = Router();
const contactLimiter = createRateLimiter(3, 15 * 60 * 1000);
const contactAgentLimiter = createRateLimiter(6, 15 * 60 * 1000);

function normalizeHeaderValue(value: unknown, maxLength = 120) {
  if (typeof value !== "string") {
    return "unknown";
  }

  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength).toLowerCase() : "unknown";
}

function isValidEmail(value: unknown) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

contactRouter.post("/", async (req, res) => {
  const { name, email, phone, message, source, honeypot } = req.body ?? {};

  if (typeof honeypot === "string" && honeypot.trim()) {
    return res.json({ success: true });
  }

  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }

  const ipKey = `contact:ip:${getClientAddress(req)}`;
  const emailKey = `contact:email:${String(email).trim().toLowerCase()}`;
  const agentKey = `contact:agent:${normalizeHeaderValue(req.header("user-agent"))}`;
  const ipLimit = contactLimiter.hit(ipKey);
  const emailLimit = contactLimiter.hit(emailKey);
  const agentLimit = contactAgentLimiter.hit(agentKey);

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  const safeMessage = String(message).trim();
  if (safeMessage.length < 20 || safeMessage.length > 4000) {
    return res.status(400).json({ error: "Please provide a message between 20 and 4000 characters." });
  }

  const safeName = String(name).trim();
  if (safeName.length < 2 || safeName.length > 120) {
    return res.status(400).json({ error: "Please provide a valid name." });
  }

  if (!ipLimit.allowed || !emailLimit.allowed || !agentLimit.allowed) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  const safeSource = typeof source === "string" && source.trim() ? source.trim().slice(0, 60) : "Website";
  const safePhone = typeof phone === "string" ? phone.trim() : "";

  try {
    const response = await resend.emails.send({
      from: resendFrom,
      to: adminNotificationEmail,
      replyTo: String(email).trim(),
      subject: `New ${safeSource} lead: ${safeName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 24px; color: #0f172a;">
          <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #64748b;">
            IBPA lead form
          </p>
          <h1 style="margin: 0 0 20px; font-size: 28px; line-height: 1.1;">
            ${safeName}
          </h1>
          <div style="margin: 24px 0; padding: 16px 18px; background: #f8fafc; border-radius: 18px;">
            <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.7;"><strong>Source:</strong> ${safeSource}</p>
            <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.7;"><strong>Email:</strong> ${email}</p>
            ${safePhone ? `<p style="margin: 0 0 8px; font-size: 14px; line-height: 1.7;"><strong>Phone:</strong> ${safePhone}</p>` : ""}
            <p style="margin: 0; font-size: 14px; line-height: 1.7;"><strong>Message:</strong><br/>${safeMessage.replace(/\n/g, "<br/>")}</p>
          </div>
        </div>
      `,
    });

    return res.json({ success: true, id: response.data?.id ?? null });
  } catch (error) {
    console.error("Failed to send contact lead email", error);
    return res.status(500).json({ error: "Failed to send contact inquiry." });
  }
});
