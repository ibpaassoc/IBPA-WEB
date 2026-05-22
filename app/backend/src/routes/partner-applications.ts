import { Router } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import crypto from "crypto";
import { requireDb, orders, partnerApplications } from "../lib/db";
import { adminNotificationEmail, resend, resendFrom } from "../services/email";
import { adminClerkMiddleware, requireAdminAccess } from "../services/admin";
import { createRateLimiter, getClientAddress } from "../lib/rate-limit";
import { stripe } from "../services/stripe";

export const partnerApplicationsRouter = Router();

const SPONSORSHIP_PRICE_KEYS = {
  Associate: "STRIPE_PRICE_SPONSOR_ASSOCIATE",
  Community: "STRIPE_PRICE_SPONSOR_COMMUNITY",
  Premier: "STRIPE_PRICE_SPONSOR_PREMIER",
} as const;

type PartnerTier = keyof typeof SPONSORSHIP_PRICE_KEYS;
const PARTNER_TIERS = new Set(Object.keys(SPONSORSHIP_PRICE_KEYS) as PartnerTier[]);
const PARTNER_STATUSES = new Set(["PENDING", "APPROVED", "REJECTED"]);
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
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : null;
  }

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

function getPartnerSearchCondition(q: unknown) {
  if (typeof q !== "string" || !q.trim()) {
    return undefined;
  }

  const term = `%${q.trim()}%`;
  return sql`(${partnerApplications.name} ilike ${term} or ${partnerApplications.email} ilike ${term} or ${partnerApplications.message} ilike ${term})`;
}

type SqlCondition = ReturnType<typeof sql>;

function combineConditions(...conditions: Array<SqlCondition | undefined>) {
  const active = conditions.filter((condition): condition is SqlCondition => Boolean(condition));
  return active.length > 0 ? and(...active) : undefined;
}

async function ensurePartnerOrderForApproval(params: {
  db: ReturnType<typeof requireDb>;
  application: typeof partnerApplications.$inferSelect;
  selectedTier: PartnerTier;
}) {
  const { db, application, selectedTier } = params;
  const partnerPayload = {
    type: "partner",
    partnerApplicationId: application.id,
    partnerTier: selectedTier,
    partnerMessage: application.message,
    partnerPhone: application.phone,
  };

  if (application.partnerOrderId) {
    const [linkedOrder] = await db
      .select({
        id: orders.id,
        secureToken: orders.secureToken,
        status: orders.status,
      })
      .from(orders)
      .where(and(eq(orders.id, application.partnerOrderId), sql`lower(${orders.accountType}) = 'partner'`))
      .limit(1);

    if (linkedOrder) {
      if (linkedOrder.status !== "paid") {
        await db
          .update(orders)
          .set({
            email: application.email,
            name: application.name,
            phone: application.phone,
            accountType: "partner",
            membershipCategory: "partner",
            applicantType: "Partner",
            package: selectedTier,
            applicationPayload: partnerPayload,
            status: "approved",
          })
          .where(eq(orders.id, linkedOrder.id));
      }

      return linkedOrder;
    }
  }

  const [existingOrder] = await db
    .select({
      id: orders.id,
      secureToken: orders.secureToken,
      status: orders.status,
    })
    .from(orders)
    .where(
      and(
        sql`lower(${orders.accountType}) = 'partner'`,
        sql`${orders.applicationPayload} ->> 'partnerApplicationId' = ${application.id}`,
      ),
    )
    .limit(1);

  if (existingOrder) {
    if (existingOrder.status !== "paid") {
      await db
        .update(orders)
        .set({
          email: application.email,
          name: application.name,
          phone: application.phone,
          accountType: "partner",
          membershipCategory: "partner",
          applicantType: "Partner",
          package: selectedTier,
          applicationPayload: partnerPayload,
          status: "approved",
        })
        .where(eq(orders.id, existingOrder.id));
    }

    await db
      .update(partnerApplications)
      .set({
        partnerOrderId: existingOrder.id,
        updatedAt: new Date(),
      })
      .where(eq(partnerApplications.id, application.id));

    return existingOrder;
  }

  const [createdOrder] = await db
    .insert(orders)
    .values({
      email: application.email,
      name: application.name,
      phone: application.phone,
      accountType: "partner",
      membershipCategory: "partner",
      applicantType: "Partner",
      package: selectedTier,
      applicationPayload: partnerPayload,
      status: "approved",
      secureToken: crypto.randomUUID(),
    })
    .returning({
      id: orders.id,
      secureToken: orders.secureToken,
      status: orders.status,
    });

  await db
    .update(partnerApplications)
    .set({
      partnerOrderId: createdOrder.id,
      updatedAt: new Date(),
    })
    .where(eq(partnerApplications.id, application.id));

  return createdOrder;
}

async function sendPartnerApplicationReceivedEmail(params: {
  email: string;
  name: string;
  requestedTier?: string | null;
}) {
  const { email, name, requestedTier } = params;

  return resend.emails.send({
    from: resendFrom,
    to: email,
    subject: "Your IBPA partnership application has been received",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 24px; color: #0f172a;">
        <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #64748b;">
          International Beauty Professionals Association
        </p>
        <h1 style="margin: 0 0 20px; font-size: 28px; line-height: 1.1; text-transform: uppercase;">
          Partnership application received
        </h1>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">
          Hello ${name || "there"},
        </p>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">
          Thank you for your interest in partnering with IBPA. Our team has received your application${requestedTier ? ` for the <strong>${requestedTier}</strong> tier` : ""} and will review it shortly.
        </p>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">
          If approved, we will send your payment link with next steps.
        </p>
      </div>
    `,
  });
}

async function sendAdminPartnerApplicationEmail(params: {
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  requestedTier?: string | null;
}) {
  const { name, email, phone, message, requestedTier } = params;

  return resend.emails.send({
    from: resendFrom,
    to: adminNotificationEmail,
    subject: `New IBPA partner application: ${name || email}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 720px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 24px; color: #0f172a;">
        <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #64748b;">
          New partner application
        </p>
        <h1 style="margin: 0 0 20px; font-size: 28px; line-height: 1.1;">
          ${name || "New applicant"}
        </h1>
        <div style="margin: 24px 0; padding: 16px 18px; background: #f8fafc; border-radius: 18px;">
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.7;"><strong>Email:</strong> ${email}</p>
          ${phone ? `<p style="margin: 0 0 8px; font-size: 14px; line-height: 1.7;"><strong>Phone:</strong> ${phone}</p>` : ""}
          ${requestedTier ? `<p style="margin: 0 0 8px; font-size: 14px; line-height: 1.7;"><strong>Requested tier:</strong> ${requestedTier}</p>` : ""}
          <p style="margin: 0; font-size: 14px; line-height: 1.7;"><strong>Message:</strong><br/>${message.replace(/\n/g, "<br/>")}</p>
        </div>
      </div>
    `,
  });
}

async function sendPartnerApprovalEmail(params: {
  email: string;
  name: string;
  requestedTier: string;
  checkoutUrl?: string | null;
}) {
  const { email, name, requestedTier, checkoutUrl } = params;

  return resend.emails.send({
    from: resendFrom,
    to: email,
    subject: "Your IBPA partner application has been approved",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 24px; color: #0f172a;">
        <h1 style="margin: 0 0 18px; font-size: 30px; line-height: 1.1;">Congratulations, ${name || "there"}!</h1>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">
          Your IBPA partner application has been approved for the <strong>${requestedTier}</strong> tier.
        </p>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">
          To activate your partner account, complete payment with the link below:
        </p>
        <div style="margin: 28px 0;">
          <a href="${checkoutUrl || "#"}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">
            Complete payment
          </a>
        </div>
        <p style="margin: 0; font-size: 13px; line-height: 1.7; color: #64748b;">
          If the button does not work, copy this link:<br />${checkoutUrl || ""}
        </p>
      </div>
    `,
  });
}

async function sendAdminPartnerPaymentLinkSentEmail(params: {
  applicationId: string;
  name: string;
  email: string;
  requestedTier: string;
  checkoutUrl?: string | null;
}) {
  const { applicationId, name, email, requestedTier, checkoutUrl } = params;

  return resend.emails.send({
    from: resendFrom,
    to: adminNotificationEmail,
    subject: `IBPA partner payment link sent: ${name || email}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 20px; color: #0f172a;">
        <h1 style="margin: 0 0 16px; font-size: 24px;">Partner payment link sent</h1>
        <p style="margin: 0 0 10px;"><strong>Applicant:</strong> ${name || "Unknown"}</p>
        <p style="margin: 0 0 10px;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 0 0 10px;"><strong>Tier:</strong> ${requestedTier}</p>
        <p style="margin: 0 0 10px;"><strong>Partner application ID:</strong> ${applicationId}</p>
        ${checkoutUrl ? `<p style="margin: 18px 0 0;"><a href="${checkoutUrl}">Stripe checkout link</a></p>` : ""}
      </div>
    `,
  });
}

async function sendPartnerRejectedEmail(params: { email: string; name: string }) {
  const { email, name } = params;

  return resend.emails.send({
    from: resendFrom,
    to: email,
    subject: "Your IBPA partner application was not approved",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 20px;">
        <h2 style="color: #333; text-transform: uppercase;">Hello, ${name || "there"}!</h2>
        <p>Thank you for your interest in partnering with IBPA.</p>
        <p>After review, we are unable to approve your partner application at this time.</p>
        <p style="color: #666; font-size: 14px;">If you have questions, reply to this email or contact us at info@ibpassociations.org.</p>
      </div>
    `,
  });
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
    const [recentDuplicate] = await db
      .select({ id: partnerApplications.id, createdAt: partnerApplications.createdAt })
      .from(partnerApplications)
      .where(eq(partnerApplications.email, safeEmail))
      .orderBy(desc(partnerApplications.createdAt))
      .limit(1);

    if (recentDuplicate && Date.now() - new Date(recentDuplicate.createdAt).getTime() < 5 * 60 * 1000) {
      return res.status(409).json({ error: "A recent partner application already exists for this email. Please wait a few minutes before trying again." });
    }

    const [created] = await db
      .insert(partnerApplications)
      .values({
        name: safeName,
        email: safeEmail,
        phone: safePhone,
        message: safeMessage,
        requestedTier: normalizedTier,
        status: "PENDING",
        paymentStatus: "UNPAID",
      })
      .returning();

    try {
      const emailResult = await sendPartnerApplicationReceivedEmail({
        email: safeEmail,
        name: safeName,
        requestedTier: normalizedTier,
      });
      console.log("[Partner Application] Confirmation email sent", {
        to: safeEmail,
        id: emailResult.data?.id ?? null,
        error: emailResult.error ?? null,
      });
    } catch (emailError) {
      console.error("[Partner Application] Confirmation email failed", {
        to: safeEmail,
        error: emailError,
      });
    }

    try {
      const adminEmailResult = await sendAdminPartnerApplicationEmail({
        name: safeName,
        email: safeEmail,
        phone: safePhone,
        message: safeMessage,
        requestedTier: normalizedTier,
      });
      console.log("[Partner Application] Admin notification email sent", {
        to: adminNotificationEmail,
        id: adminEmailResult.data?.id ?? null,
        error: adminEmailResult.error ?? null,
      });
    } catch (emailError) {
      console.error("[Partner Application] Admin notification email failed", {
        to: adminNotificationEmail,
        error: emailError,
      });
    }

    return res.status(201).json({ success: true, id: created.id });
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
    const statusFilter =
      statusRaw && PARTNER_STATUSES.has(statusRaw.trim().toUpperCase())
        ? statusRaw.trim().toUpperCase()
        : null;

    const paymentRaw = getSingleValue(req.query.paymentStatus);
    const paymentFilter =
      paymentRaw && PARTNER_PAYMENT_STATUSES.has(paymentRaw.trim().toUpperCase())
        ? paymentRaw.trim().toUpperCase()
        : null;

    const searchCondition = getPartnerSearchCondition(req.query.q);
    const whereCondition = combineConditions(
      searchCondition,
      statusFilter ? eq(partnerApplications.status, statusFilter) : undefined,
      paymentFilter ? eq(partnerApplications.paymentStatus, paymentFilter) : undefined,
    );
    const searchOnlyCondition = combineConditions(searchCondition);

    const itemsQuery = db
      .select({
        id: partnerApplications.id,
        name: partnerApplications.name,
        email: partnerApplications.email,
        phone: partnerApplications.phone,
        message: partnerApplications.message,
        requestedTier: partnerApplications.requestedTier,
        status: partnerApplications.status,
        paymentStatus: partnerApplications.paymentStatus,
        stripeCheckoutSessionId: partnerApplications.stripeCheckoutSessionId,
        stripePaymentIntentId: partnerApplications.stripePaymentIntentId,
        stripeInvoiceId: partnerApplications.stripeInvoiceId,
        approvedAt: partnerApplications.approvedAt,
        paidAt: partnerApplications.paidAt,
        createdAt: partnerApplications.createdAt,
        updatedAt: partnerApplications.updatedAt,
      })
      .from(partnerApplications)
      .orderBy(desc(partnerApplications.createdAt))
      .limit(limit)
      .offset(offset);

    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(partnerApplications);

    if (whereCondition) {
      itemsQuery.where(whereCondition);
      countQuery.where(whereCondition);
    }

    const summaryBaseQuery = db
      .select({
        status: partnerApplications.status,
        paymentStatus: partnerApplications.paymentStatus,
        count: sql<number>`count(*)`,
      })
      .from(partnerApplications)
      .groupBy(partnerApplications.status, partnerApplications.paymentStatus);

    if (searchOnlyCondition) {
      summaryBaseQuery.where(searchOnlyCondition);
    }

    const [items, countRows, summaryRows] = await Promise.all([
      itemsQuery,
      countQuery,
      summaryBaseQuery,
    ]);

    const total = countToNumber(countRows[0]?.count);
    const summary = {
      all: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      paid: 0,
    };

    for (const row of summaryRows) {
      const count = countToNumber(row.count);
      summary.all += count;

      const status = String(row.status || "").toUpperCase();
      if (status === "PENDING") summary.pending += count;
      if (status === "APPROVED") summary.approved += count;
      if (status === "REJECTED") summary.rejected += count;

      const paymentStatus = String(row.paymentStatus || "").toUpperCase();
      if (paymentStatus === "PAID") summary.paid += count;
    }

    return res.json({
      items,
      total,
      summary,
      limit,
      offset,
      hasMore: offset + items.length < total,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

    console.error("[Partner Application] Failed to fetch partner applications", error);
    return res.status(500).json({ error: "Failed to fetch partner applications" });
  }
});

partnerApplicationsRouter.get("/:id", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const applicationId = getSingleValue(req.params.id);
  if (!applicationId) {
    return res.status(400).json({ error: "Invalid partner application id" });
  }

  try {
    const db = requireDb();
    const [application] = await db
      .select()
      .from(partnerApplications)
      .where(eq(partnerApplications.id, applicationId));

    if (!application) {
      return res.status(404).json({ error: "Partner application not found" });
    }

    return res.json(application);
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

    console.error("[Partner Application] Failed to fetch partner application detail", error);
    return res.status(500).json({ error: "Failed to fetch partner application detail" });
  }
});

partnerApplicationsRouter.post("/admin/approve", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const applicationId = getSingleValue(req.body?.applicationId);
  const requestedTier = normalizePartnerTier(req.body?.tier);

  if (!applicationId) {
    return res.status(400).json({ error: "Invalid partner application id" });
  }

  try {
    const db = requireDb();
    const [application] = await db
      .select()
      .from(partnerApplications)
      .where(eq(partnerApplications.id, applicationId));

    if (!application) {
      return res.status(404).json({ error: "Partner application not found" });
    }

    if (application.paymentStatus === "PAID") {
      return res.status(409).json({ error: "This partner application is already paid." });
    }

    if (application.status === "REJECTED") {
      return res.status(409).json({ error: "Rejected partner applications cannot be approved." });
    }

    const selectedTier = requestedTier || normalizePartnerTier(application.requestedTier) || "Associate";
    const priceId = getPartnerPriceId(selectedTier);
    const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
    if (!frontendUrl) {
      throw new Error("FRONTEND_URL is not configured");
    }

    const partnerOrder = await ensurePartnerOrderForApproval({
      db,
      application,
      selectedTier,
    });

    const metadata = {
      type: "partner_application",
      orderKind: "partner_application",
      orderId: partnerOrder.id,
      partnerApplicationId: application.id,
      partnerTier: selectedTier,
    };
    const price = await stripe.prices.retrieve(priceId);
    const usesRecurringPrice = Boolean(price.recurring);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: application.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: usesRecurringPrice ? "subscription" : "payment",
      success_url: `${frontendUrl}/success?token=${encodeURIComponent(partnerOrder.secureToken)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/partnership?payment=cancelled&tier=${encodeURIComponent(selectedTier)}`,
      ...(usesRecurringPrice ? { subscription_data: { metadata } } : {}),
      metadata,
    });

    await db
      .update(partnerApplications)
      .set({
        requestedTier: selectedTier,
        status: "APPROVED",
        paymentStatus: "PENDING",
        stripeCheckoutSessionId: session.id,
        partnerOrderId: partnerOrder.id,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(partnerApplications.id, applicationId));

    try {
      const emailResult = await sendPartnerApprovalEmail({
        email: application.email,
        name: application.name,
        requestedTier: selectedTier,
        checkoutUrl: session.url,
      });
      console.log("[Partner Application] Approval email sent", {
        to: application.email,
        id: emailResult.data?.id ?? null,
        error: emailResult.error ?? null,
      });
    } catch (emailError) {
      console.error("[Partner Application] Approval email failed", {
        to: application.email,
        error: emailError,
      });
    }

    try {
      const adminEmailResult = await sendAdminPartnerPaymentLinkSentEmail({
        applicationId: application.id,
        name: application.name,
        email: application.email,
        requestedTier: selectedTier,
        checkoutUrl: session.url,
      });
      console.log("[Partner Application] Admin payment link notification sent", {
        to: adminNotificationEmail,
        id: adminEmailResult.data?.id ?? null,
        error: adminEmailResult.error ?? null,
      });
    } catch (adminEmailError) {
      console.error("[Partner Application] Admin payment link notification failed", {
        to: adminNotificationEmail,
        error: adminEmailError,
      });
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
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

    console.error("[Partner Application] Failed to approve partner application", error);
    if (error instanceof Error) {
      if (error.message.includes("not configured")) {
        return res.status(503).json({ error: error.message });
      }

      if (error.message.toLowerCase().includes("invalid api key")) {
        return res.status(503).json({ error: "STRIPE_SECRET_KEY is not configured correctly." });
      }
    }

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
    const [application] = await db
      .select()
      .from(partnerApplications)
      .where(eq(partnerApplications.id, applicationId));

    if (!application) {
      return res.status(404).json({ error: "Partner application not found" });
    }

    if (application.paymentStatus === "PAID") {
      return res.status(409).json({ error: "Paid partner applications cannot be rejected." });
    }

    await db
      .update(partnerApplications)
      .set({
        status: "REJECTED",
        updatedAt: new Date(),
      })
      .where(eq(partnerApplications.id, applicationId));

    try {
      const emailResult = await sendPartnerRejectedEmail({
        email: application.email,
        name: application.name,
      });
      console.log("[Partner Application] Rejection email sent", {
        to: application.email,
        id: emailResult.data?.id ?? null,
        error: emailResult.error ?? null,
      });
    } catch (emailError) {
      console.error("[Partner Application] Rejection email failed", {
        to: application.email,
        error: emailError,
      });
    }

    return res.json({ success: true, status: "REJECTED" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

    console.error("[Partner Application] Failed to reject partner application", error);
    return res.status(500).json({ error: "Failed to reject partner application" });
  }
});
