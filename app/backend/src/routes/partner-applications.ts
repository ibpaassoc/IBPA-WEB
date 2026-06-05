import crypto from "crypto";
import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { requireDb } from "../lib/db";
import { coreApplications, corePayments, coreTeams } from "../lib/schema";
import {
  APPLICATIONS_REPLY_TO,
  APPLICATIONS_SENDER,
  PAYMENTS_REPLY_TO,
  PAYMENTS_SENDER,
  adminNotificationEmail,
  applicationsEmail,
  sendEmail,
} from "../services/email";
import { adminClerkMiddleware, requireAdminAccess } from "../services/admin";
import { createRateLimiter, getClientAddress } from "../lib/rate-limit";
import { stripe } from "../services/stripe";
import { ensureCanonicalUser } from "../features/users/server/user.service";
import { upsertCanonicalApplication } from "../features/applications/server/application.repository";
import { upsertCanonicalPayment } from "../features/payments/server/payment.repository";

export const partnerApplicationsRouter = Router();

const SPONSORSHIP_PRICE_KEYS = {
  Associate: "STRIPE_PRICE_SPONSOR_ASSOCIATE",
  Community: "STRIPE_PRICE_SPONSOR_COMMUNITY",
  Premier: "STRIPE_PRICE_SPONSOR_PREMIER",
} as const;

type PartnerTier = keyof typeof SPONSORSHIP_PRICE_KEYS;
const PARTNER_TIERS = new Set(Object.keys(SPONSORSHIP_PRICE_KEYS) as PartnerTier[]);
const PARTNER_STATUSES = new Set(["PENDING", "APPROVED", "SUBMITTED", "REJECTED"]);
const PARTNER_PAYMENT_STATUSES = new Set(["UNPAID", "PENDING", "PAID", "FAILED"]);

const partnerApplicationLimiter = createRateLimiter(4, 30 * 60 * 1000);
const partnerApplicationAgentLimiter = createRateLimiter(8, 30 * 60 * 1000);

const ADMIN_PARTNER_LIST_DEFAULT_LIMIT = 20;
const ADMIN_PARTNER_LIST_MAX_LIMIT = 50;

function normalizeHeaderValue(value: unknown, maxLength = 120) {
  if (typeof value !== "string") {
    return "unknown";
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength).toLowerCase() : "unknown";
}

function countToNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value || 0);
}

function getSingleValue(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : null;
  return null;
}

function getPaginationParams(query: Record<string, unknown>, defaultLimit: number, maxLimit: number) {
  const rawLimit = Number(query.limit);
  const rawOffset = Number(query.offset);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), maxLimit)
    : defaultLimit;
  const offset = Number.isFinite(rawOffset) ? Math.max(Math.trunc(rawOffset), 0) : 0;
  return { limit, offset };
}

function isValidEmail(value: unknown) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function normalizePartnerTier(value: unknown): PartnerTier | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return PARTNER_TIERS.has(normalized as PartnerTier) ? (normalized as PartnerTier) : null;
}

function getPartnerPriceId(tier: PartnerTier) {
  const key = SPONSORSHIP_PRICE_KEYS[tier];
  return getRequiredEnv(key);
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function mapApplicationStatus(application: typeof coreApplications.$inferSelect, payment: typeof corePayments.$inferSelect | null) {
  if (payment?.status === "PAID") {
    return "SUBMITTED";
  }
  switch (application.status) {
    case "REJECTED":
      return "REJECTED";
    case "APPROVED":
    case "PAYMENT_SENT":
      return "APPROVED";
    default:
      return "PENDING";
  }
}

function mapPaymentStatus(payment: typeof corePayments.$inferSelect | null) {
  if (!payment) {
    return "UNPAID";
  }
  switch (payment.status) {
    case "PAID":
      return "PAID";
    case "FAILED":
      return "FAILED";
    default:
      return "PENDING";
  }
}

function toAdminShape(application: typeof coreApplications.$inferSelect, payment: typeof corePayments.$inferSelect | null, team: typeof coreTeams.$inferSelect | null) {
  const payload = asRecord(application.applicationData);

  return {
    id: application.id,
    name: application.fullName,
    email: application.email,
    phone: application.phone ?? null,
    message: typeof payload.message === "string" ? payload.message : "",
    requestedTier: application.packageName ?? null,
    status: mapApplicationStatus(application, payment),
    paymentStatus: mapPaymentStatus(payment),
    stripeCheckoutSessionId: payment?.stripeSessionId ?? null,
    stripePaymentIntentId: typeof payload.stripePaymentIntentId === "string" ? payload.stripePaymentIntentId : null,
    stripeInvoiceId: typeof payload.stripeInvoiceId === "string" ? payload.stripeInvoiceId : null,
    partnerOrderId: team?.id ?? null,
    approvedAt: application.approvedAt,
    paidAt: payment?.paidAt ?? null,
    createdAt: application.createdAt,
    updatedAt: application.approvedAt ?? application.createdAt,
  };
}

async function sendPartnerApplicationReceivedEmail(params: { email: string; name: string; requestedTier?: string | null; }) {
  return sendEmail({
    from: APPLICATIONS_SENDER,
    to: params.email,
    replyTo: APPLICATIONS_REPLY_TO,
    subject: "Your IBPA partnership application has been received",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 24px; color: #0f172a;">
        <h1 style="margin: 0 0 20px; font-size: 28px; line-height: 1.1; text-transform: uppercase;">Partnership application received</h1>
        <p>Hello ${escapeHtml(params.name || "there")},</p>
        <p>Thank you for your interest in partnering with IBPA. Our team has received your application${params.requestedTier ? ` for the <strong>${escapeHtml(params.requestedTier)}</strong> tier` : ""} and will review it shortly.</p>
      </div>
    `,
  });
}

async function sendAdminPartnerApplicationEmail(params: { name: string; email: string; phone?: string | null; message: string; requestedTier?: string | null; }) {
  return sendEmail({
    from: APPLICATIONS_SENDER,
    to: adminNotificationEmail,
    replyTo: APPLICATIONS_REPLY_TO,
    subject: `New IBPA partner application: ${params.name || params.email}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 720px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 24px; color: #0f172a;">
        <h1 style="margin: 0 0 20px; font-size: 28px; line-height: 1.1;">${escapeHtml(params.name || "New applicant")}</h1>
        <p><strong>Email:</strong> ${escapeHtml(params.email)}</p>
        ${params.phone ? `<p><strong>Phone:</strong> ${escapeHtml(params.phone)}</p>` : ""}
        ${params.requestedTier ? `<p><strong>Requested tier:</strong> ${escapeHtml(params.requestedTier)}</p>` : ""}
        <p><strong>Message:</strong><br/>${escapeHtml(params.message).replace(/\n/g, "<br/>")}</p>
      </div>
    `,
  });
}

async function sendPartnerApprovalEmail(params: { email: string; name: string; requestedTier: string; checkoutUrl?: string | null; }) {
  return sendEmail({
    from: APPLICATIONS_SENDER,
    to: params.email,
    replyTo: APPLICATIONS_REPLY_TO,
    subject: "Your IBPA partner application has been approved",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 24px; color: #0f172a;">
        <h1 style="margin: 0 0 18px; font-size: 30px; line-height: 1.1;">Congratulations, ${escapeHtml(params.name || "there")}!</h1>
        <p>Your IBPA partner application has been approved for the <strong>${escapeHtml(params.requestedTier)}</strong> tier.</p>
        <p>To activate your partner account, complete payment with the link below:</p>
        <p><a href="${escapeHtml(params.checkoutUrl || "#")}">Complete payment</a></p>
      </div>
    `,
  });
}

async function sendAdminPartnerPaymentLinkSentEmail(params: { applicationId: string; name: string; email: string; requestedTier: string; checkoutUrl?: string | null; }) {
  return sendEmail({
    from: PAYMENTS_SENDER,
    to: adminNotificationEmail,
    replyTo: PAYMENTS_REPLY_TO,
    subject: `IBPA partner payment link sent: ${params.name || params.email}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 20px; color: #0f172a;">
        <p><strong>Applicant:</strong> ${escapeHtml(params.name || "Unknown")}</p>
        <p><strong>Email:</strong> ${escapeHtml(params.email)}</p>
        <p><strong>Tier:</strong> ${escapeHtml(params.requestedTier)}</p>
        <p><strong>Partner application ID:</strong> ${escapeHtml(params.applicationId)}</p>
        ${params.checkoutUrl ? `<p><a href="${escapeHtml(params.checkoutUrl)}">Stripe checkout link</a></p>` : ""}
      </div>
    `,
  });
}

async function sendPartnerRejectedEmail(params: { email: string; name: string; }) {
  return sendEmail({
    from: APPLICATIONS_SENDER,
    to: params.email,
    replyTo: APPLICATIONS_REPLY_TO,
    subject: "Your IBPA partner application was not approved",
    html: `<div style="font-family: Arial, sans-serif; padding: 20px;"><p>Hello ${escapeHtml(params.name || "there")}!</p><p>After review, we are unable to approve your partner application at this time.</p></div>`,
  });
}

async function loadPartnerApplicationRows(db: ReturnType<typeof requireDb>) {
  const rows = await db
    .select({
      application: coreApplications,
      payment: corePayments,
      team: coreTeams,
    })
    .from(coreApplications)
    .leftJoin(corePayments, eq(corePayments.id, coreApplications.id))
    .leftJoin(coreTeams, eq(coreTeams.id, coreApplications.id))
    .where(eq(coreApplications.type, "PARTNER"))
    .orderBy(desc(coreApplications.createdAt));

  return rows.map((row: any) => toAdminShape(row.application, row.payment, row.team));
}

async function createPartnerCheckoutSession(application: typeof coreApplications.$inferSelect) {
  const selectedTier = normalizePartnerTier(application.packageName) || "Associate";
  const priceId = getPartnerPriceId(selectedTier);
  const price = await stripe.prices.retrieve(priceId);
  const usesRecurringPrice = Boolean(price.recurring);
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: application.email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: usesRecurringPrice ? "subscription" : "payment",
    success_url: `${(process.env.FRONTEND_URL || "").replace(/\/$/, "")}/partnership?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${(process.env.FRONTEND_URL || "").replace(/\/$/, "")}/partnership?payment=cancelled`,
    metadata: {
      orderKind: "partner_application",
      partnerApplicationId: application.id,
      requestedTier: selectedTier,
    },
  });

  const db = requireDb();
  const nextPayload = {
    ...asRecord(application.applicationData),
    stripeCheckoutSessionId: session.id,
  };
  await upsertCanonicalApplication(db, {
    id: application.id,
    userId: application.userId ?? null,
    type: "PARTNER",
    packageName: selectedTier,
    status: "APPROVED",
    fullName: application.fullName,
    email: application.email,
    phone: application.phone ?? null,
    paymentLink: application.paymentLink ?? null,
    applicationData: nextPayload,
    applicationFiles: application.applicationFiles,
    approvedAt: new Date(),
    createdAt: application.createdAt,
  });
  await upsertCanonicalPayment(db, {
    id: application.id,
    userId: application.userId ?? null,
    type: "membership_partner",
    stripeSessionId: session.id,
    amount: typeof price.unit_amount === "number" ? price.unit_amount : 0,
    status: "PENDING",
    createdAt: application.createdAt,
    paidAt: null,
  });

  return {
    session,
    selectedTier,
  };
}

partnerApplicationsRouter.post("/", async (req, res) => {
  const { name, email, phone, message, honeypot, requestedTier } = req.body ?? {};

  if (typeof honeypot === "string" && honeypot.trim()) {
    return res.json({ success: true });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  const safeName = typeof name === "string" ? name.trim() : "";
  if (safeName.length < 2 || safeName.length > 120) {
    return res.status(400).json({ error: "Please provide a valid name." });
  }

  const safeMessage = typeof message === "string" ? message.trim() : "";
  if (safeMessage.length < 20 || safeMessage.length > 4000) {
    return res.status(400).json({ error: "Please provide a message between 20 and 4000 characters." });
  }

  const safePhone = typeof phone === "string" ? phone.trim().slice(0, 50) : null;
  const normalizedTier = normalizePartnerTier(requestedTier);
  const clientIp = getClientAddress(req);
  const safeEmail = String(email).trim().toLowerCase();
  const userAgent = normalizeHeaderValue(req.header("user-agent"));
  const ipLimit = partnerApplicationLimiter.hit(`partner-applications:ip:${clientIp}`);
  const emailLimit = partnerApplicationLimiter.hit(`partner-applications:email:${safeEmail}`);
  const agentLimit = partnerApplicationAgentLimiter.hit(`partner-applications:agent:${userAgent}`);

  if (!ipLimit.allowed || !emailLimit.allowed || !agentLimit.allowed) {
    return res.status(429).json({ error: "Too many submissions. Please try again later." });
  }

  try {
    const db = requireDb();
    const recentDuplicate = await db
      .select({ id: coreApplications.id, createdAt: coreApplications.createdAt })
      .from(coreApplications)
      .where(eq(coreApplications.email, safeEmail))
      .orderBy(desc(coreApplications.createdAt))
      .limit(1);

    if (recentDuplicate[0] && Date.now() - new Date(recentDuplicate[0].createdAt).getTime() < 5 * 60 * 1000) {
      return res.status(409).json({ error: "A recent partner application already exists for this email. Please wait a few minutes before trying again." });
    }

    const userResult = await ensureCanonicalUser(db, {
      email: safeEmail,
      clerkId: null,
      role: "PARTNER",
      status: "ACTIVE",
    });

    const created = await upsertCanonicalApplication(db, {
      id: crypto.randomUUID(),
      userId: userResult.record.id,
      type: "PARTNER",
      packageName: normalizedTier ?? null,
      status: "SUBMITTED",
      fullName: safeName,
      email: safeEmail,
      phone: safePhone,
      paymentLink: null,
      applicationData: {
        message: safeMessage,
        requestedTier: normalizedTier,
      },
      applicationFiles: [],
      approvedAt: null,
      createdAt: new Date(),
    });

    try {
      await sendPartnerApplicationReceivedEmail({
        email: safeEmail,
        name: safeName,
        requestedTier: normalizedTier,
      });
      await sendAdminPartnerApplicationEmail({
        name: safeName,
        email: safeEmail,
        phone: safePhone,
        message: safeMessage,
        requestedTier: normalizedTier,
      });
    } catch (emailError) {
      console.error("[Partner Application] Email notifications failed", emailError);
    }

    return res.status(201).json({ success: true, id: created.record.id });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("[Partner Application] Failed to create partner application", error);
    return res.status(500).json({ error: "Failed to submit partner application." });
  }
});

partnerApplicationsRouter.get("/", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  try {
    const db = requireDb();
    const { limit, offset } = getPaginationParams(req.query, ADMIN_PARTNER_LIST_DEFAULT_LIMIT, ADMIN_PARTNER_LIST_MAX_LIMIT);
    const statusRaw = getSingleValue(req.query.status);
    const statusFilter = statusRaw && PARTNER_STATUSES.has(statusRaw.trim().toUpperCase()) ? statusRaw.trim().toUpperCase() : null;
    const paymentRaw = getSingleValue(req.query.paymentStatus);
    const paymentFilter = paymentRaw && PARTNER_PAYMENT_STATUSES.has(paymentRaw.trim().toUpperCase()) ? paymentRaw.trim().toUpperCase() : null;
    const query = (getSingleValue(req.query.q) || "").trim().toLowerCase();

    const rows = await loadPartnerApplicationRows(db);
    const filtered = rows.filter((item: any) => {
      const matchesStatus = !statusFilter || item.status === statusFilter;
      const matchesPayment = !paymentFilter || item.paymentStatus === paymentFilter;
      const matchesQuery = !query || [item.name, item.email, item.message].some((value) => String(value || "").toLowerCase().includes(query));
      return matchesStatus && matchesPayment && matchesQuery;
    });
    const items = filtered.slice(offset, offset + limit);

    const summary = {
      all: filtered.length,
      pending: filtered.filter((item: any) => item.status === "PENDING").length,
      approved: filtered.filter((item: any) => item.status === "APPROVED").length,
      submitted: filtered.filter((item: any) => item.status === "SUBMITTED").length,
      rejected: filtered.filter((item: any) => item.status === "REJECTED").length,
      paid: filtered.filter((item: any) => item.paymentStatus === "PAID").length,
    };

    return res.json({
      items,
      total: filtered.length,
      summary,
      limit,
      offset,
      hasMore: offset + items.length < filtered.length,
    });
  } catch (error) {
    console.error("[Partner Application] Failed to fetch partner applications", error);
    return res.status(500).json({ error: "Failed to fetch partner applications" });
  }
});

partnerApplicationsRouter.get("/:id", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  try {
    const id = getSingleValue(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "Invalid partner application id" });
    }

    const db = requireDb();
    const rows = await loadPartnerApplicationRows(db);
    const item = rows.find((row: any) => row.id === id);
    if (!item) {
      return res.status(404).json({ error: "Partner application not found" });
    }

    return res.json(item);
  } catch (error) {
    console.error("[Partner Application] Failed to fetch partner application detail", error);
    return res.status(500).json({ error: "Failed to fetch partner application detail" });
  }
});

partnerApplicationsRouter.delete("/:id", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  try {
    const id = getSingleValue(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "Invalid partner application id" });
    }

    const db = requireDb();
    await db.delete(corePayments).where(eq(corePayments.id, id));
    await db.delete(coreTeams).where(eq(coreTeams.id, id));
    const deleted = await db.delete(coreApplications).where(eq(coreApplications.id, id)).returning();
    if (!deleted[0]) {
      return res.status(404).json({ error: "Partner application not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("[Partner Application] Failed to delete partner application", error);
    return res.status(500).json({ error: "Failed to delete partner application" });
  }
});

partnerApplicationsRouter.post("/admin/delete", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const id = getSingleValue(req.body?.applicationId);
  if (!id) {
    return res.status(400).json({ error: "Invalid partner application id" });
  }

  try {
    const db = requireDb();
    await db.delete(corePayments).where(eq(corePayments.id, id));
    await db.delete(coreTeams).where(eq(coreTeams.id, id));
    const deleted = await db.delete(coreApplications).where(eq(coreApplications.id, id)).returning();
    if (!deleted[0]) {
      return res.status(404).json({ error: "Partner application not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("[Partner Application] Failed to delete partner application", error);
    return res.status(500).json({ error: "Failed to delete partner application" });
  }
});

partnerApplicationsRouter.post("/admin/approve", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const applicationId = getSingleValue(req.body?.applicationId);
  const selectedTier = normalizePartnerTier(req.body?.tier);
  if (!applicationId || !selectedTier) {
    return res.status(400).json({ error: "Invalid partner application id or tier" });
  }

  try {
    const db = requireDb();
    const [application] = await db.select().from(coreApplications).where(eq(coreApplications.id, applicationId)).limit(1);
    if (!application || application.type !== "PARTNER") {
      return res.status(404).json({ error: "Partner application not found" });
    }

    const updated = await upsertCanonicalApplication(db, {
      id: application.id,
      userId: application.userId ?? null,
      type: "PARTNER",
      packageName: selectedTier,
      status: "APPROVED",
      fullName: application.fullName,
      email: application.email,
      phone: application.phone ?? null,
      paymentLink: application.paymentLink ?? null,
      applicationData: {
        ...asRecord(application.applicationData),
        requestedTier: selectedTier,
      },
      applicationFiles: application.applicationFiles,
      approvedAt: new Date(),
      createdAt: application.createdAt,
    });

    const { session } = await createPartnerCheckoutSession(updated.record);
    try {
      await sendPartnerApprovalEmail({
        email: updated.record.email,
        name: updated.record.fullName,
        requestedTier: selectedTier,
        checkoutUrl: session.url,
      });
      await sendAdminPartnerPaymentLinkSentEmail({
        applicationId: updated.record.id,
        name: updated.record.fullName,
        email: updated.record.email,
        requestedTier: selectedTier,
        checkoutUrl: session.url,
      });
    } catch (emailError) {
      console.error("[Partner Application] Approval emails failed", emailError);
    }

    return res.json({
      success: true,
      status: "APPROVED",
      paymentStatus: "PENDING",
      requestedTier: selectedTier,
      checkoutUrl: session.url,
      stripeCheckoutSessionId: session.id,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("not configured")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("[Partner Application] Failed to approve partner application", error);
    return res.status(500).json({ error: "Failed to approve partner application" });
  }
});

partnerApplicationsRouter.post("/admin/reject", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const applicationId = getSingleValue(req.body?.applicationId);
  if (!applicationId) {
    return res.status(400).json({ error: "Invalid partner application id" });
  }

  try {
    const db = requireDb();
    const [application] = await db.select().from(coreApplications).where(eq(coreApplications.id, applicationId)).limit(1);
    if (!application || application.type !== "PARTNER") {
      return res.status(404).json({ error: "Partner application not found" });
    }
    const [payment] = await db.select().from(corePayments).where(eq(corePayments.id, applicationId)).limit(1);
    if (payment?.status === "PAID") {
      return res.status(409).json({ error: "Paid partner applications cannot be rejected." });
    }

    await upsertCanonicalApplication(db, {
      id: application.id,
      userId: application.userId ?? null,
      type: "PARTNER",
      packageName: application.packageName ?? null,
      status: "REJECTED",
      fullName: application.fullName,
      email: application.email,
      phone: application.phone ?? null,
      paymentLink: application.paymentLink ?? null,
      applicationData: application.applicationData as Record<string, unknown>,
      applicationFiles: application.applicationFiles,
      approvedAt: application.approvedAt ?? null,
      createdAt: application.createdAt,
    });

    try {
      await sendPartnerRejectedEmail({ email: application.email, name: application.fullName });
    } catch (emailError) {
      console.error("[Partner Application] Rejection email failed", emailError);
    }

    return res.json({ success: true, status: "REJECTED" });
  } catch (error) {
    console.error("[Partner Application] Failed to reject partner application", error);
    return res.status(500).json({ error: "Failed to reject partner application" });
  }
});
