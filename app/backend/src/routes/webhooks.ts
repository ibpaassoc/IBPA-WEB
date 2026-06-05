import { Router } from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";
import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { requireDb } from "../lib/db";
import {
  coreApplications,
  coreCertificates,
  coreMemberships,
  corePayments,
  coreProfiles,
  coreStripeWebhookEvents,
  coreTeams,
  coreUsers,
} from "../lib/schema";
import { stripe } from "../services/stripe";
import {
  PAYMENTS_REPLY_TO,
  PAYMENTS_SENDER,
  adminNotificationEmail,
  sendEmail,
} from "../services/email";
import { ensureCanonicalUser } from "../features/users/server/user.service";
import { upsertCanonicalPayment, upsertCanonicalStripeWebhookEvent } from "../features/payments/server/payment.repository";
import { upsertCanonicalMembership } from "../features/memberships/server/membership.repository";
import { upsertCanonicalCertificate } from "../features/certificates/server/certificate.repository";
import { upsertCanonicalProfile } from "../features/profiles/server/profile.repository";
import { upsertCanonicalTeam } from "../features/teams/server/team.repository";

export const webhooksRouter = Router();

const stripeWebhookSecretEnvKeys = [
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_WEBHOOK_SECRET_LIVE",
  "STRIPE_WEBHOOK_SECRET_TEST",
] as const;

function normalizeStripeSignatureHeader(header: string | string[] | undefined) {
  if (typeof header === "string" && header.trim()) {
    return header.trim();
  }
  if (Array.isArray(header)) {
    const first = header.find((value) => typeof value === "string" && value.trim());
    return first ? first.trim() : null;
  }
  return null;
}

function parseSecrets(value: string | undefined) {
  if (!value) {
    return [];
  }
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function getStripeWebhookSecrets() {
  const secrets = new Set<string>();
  for (const key of stripeWebhookSecretEnvKeys) {
    for (const secret of parseSecrets(process.env[key])) {
      secrets.add(secret);
    }
  }
  for (const secret of parseSecrets(process.env.STRIPE_WEBHOOK_SECRETS)) {
    secrets.add(secret);
  }
  return Array.from(secrets);
}

function getRawBodyBuffer(body: unknown) {
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }
  return null;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function splitFullName(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }
  const parts = trimmed.split(/\s+/);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

async function hasProcessedStripeEvent(db: ReturnType<typeof requireDb>, eventId: string) {
  const [existing] = await db
    .select({ id: coreStripeWebhookEvents.id })
    .from(coreStripeWebhookEvents)
    .where(eq(coreStripeWebhookEvents.stripeEventId, eventId))
    .limit(1);
  return Boolean(existing);
}

async function markStripeEventProcessed(db: ReturnType<typeof requireDb>, event: Stripe.Event) {
  await upsertCanonicalStripeWebhookEvent(db, {
    id: crypto.randomUUID(),
    stripeEventId: event.id,
    eventType: event.type,
    payload: event as unknown as Record<string, unknown>,
    processedAt: new Date(),
  });
}

async function sendDashboardActivationEmail(params: { email: string; name: string; secureToken: string; }) {
  const dashboardUrl = process.env.DASHBOARD_URL || process.env.FRONTEND_URL || "";
  const activationUrl = `${dashboardUrl.replace(/\/$/, "")}/success?token=${encodeURIComponent(params.secureToken)}`;

  return sendEmail({
    from: PAYMENTS_SENDER,
    to: params.email,
    replyTo: PAYMENTS_REPLY_TO,
    subject: "Complete your IBPA dashboard access",
    html: `<div style="font-family: Arial, sans-serif; padding: 20px;"><p>Hello ${escapeHtml(params.name || "there")},</p><p>Your payment has been received.</p><p><a href="${escapeHtml(activationUrl)}">Open dashboard access</a></p></div>`,
  });
}

async function sendAdminPaymentReceivedEmail(params: { applicationId: string; email: string; name: string; membershipCategory?: string | null; stripeSessionId?: string | null; }) {
  return sendEmail({
    from: PAYMENTS_SENDER,
    to: adminNotificationEmail,
    replyTo: PAYMENTS_REPLY_TO,
    subject: `IBPA payment received: ${params.name || params.email}`,
    html: `<div style="font-family: Arial, sans-serif; padding: 20px;"><p><strong>Applicant:</strong> ${escapeHtml(params.name || "Unknown")}</p><p><strong>Email:</strong> ${escapeHtml(params.email)}</p><p><strong>Membership:</strong> ${escapeHtml(params.membershipCategory || "N/A")}</p><p><strong>Application ID:</strong> ${escapeHtml(params.applicationId)}</p><p><strong>Stripe session:</strong> ${escapeHtml(params.stripeSessionId || "N/A")}</p></div>`,
  });
}

async function ensurePaidApplication(applicationId: string, stripeSessionId: string, subscriptionId?: string | null, paymentIntentId?: string | null, invoiceId?: string | null) {
  const db = requireDb();
  const [application] = await db.select().from(coreApplications).where(eq(coreApplications.id, applicationId)).limit(1);
  if (!application) {
    return null;
  }

  const userResult = await ensureCanonicalUser(db, {
    email: application.email,
    clerkId: null,
    role: application.type === "PARTNER" ? "PARTNER" : "MEMBER",
    status: "ACTIVE",
  });

  let expiresAt: Date | null = null;
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
    if (currentPeriodEnd) {
      expiresAt = new Date(currentPeriodEnd * 1000);
    }
  }

  const payload: Record<string, unknown> = {
    ...asRecord(application.applicationData),
    ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
    ...(invoiceId ? { stripeInvoiceId: invoiceId } : {}),
  };
  const certificateNumber = typeof payload.certificateNumber === "string" && payload.certificateNumber.trim()
    ? payload.certificateNumber
    : `CERT-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  payload.certificateNumber = certificateNumber;

  await db
    .update(coreApplications)
    .set({
      userId: userResult.record.id,
      status: "PAID",
      applicationData: payload,
      approvedAt: application.approvedAt ?? new Date(),
    })
    .where(eq(coreApplications.id, applicationId));

  await upsertCanonicalPayment(db, {
    id: applicationId,
    userId: userResult.record.id,
    type: application.type === "PARTNER" ? "membership_partner" : "membership",
    stripeSessionId,
    amount: 0,
    status: "PAID",
    createdAt: application.createdAt,
    paidAt: new Date(),
  });

  await upsertCanonicalMembership(db, {
    id: applicationId,
    userId: userResult.record.id,
    type: application.packageName || (application.type === "PARTNER" ? "partner" : "Professional"),
    status: "ACTIVE",
    startedAt: new Date(),
    expiresAt,
  });

  await upsertCanonicalCertificate(db, {
    id: applicationId,
    membershipId: applicationId,
    certificateNumber,
    certificateUrl: null,
    issuedAt: new Date(),
    expiresAt,
  });

  if (application.type === "PARTNER") {
    await upsertCanonicalTeam(db, {
      id: applicationId,
      ownerUserId: userResult.record.id,
      name: application.fullName,
      seatCount: 5,
      createdAt: application.createdAt,
    });
  }

  return {
    application: {
      ...application,
      userId: userResult.record.id,
      status: "PAID" as const,
      applicationData: payload,
    },
    user: userResult.record,
    certificateNumber,
    expiresAt,
  };
}

async function updateSubscriptionState(applicationId: string, status: "ACTIVE" | "EXPIRED" | "CANCELLED", expiresAt: Date | null) {
  const db = requireDb();
  const [membership] = await db.select().from(coreMemberships).where(eq(coreMemberships.id, applicationId)).limit(1);
  if (!membership) {
    return;
  }

  await upsertCanonicalMembership(db, {
    id: membership.id,
    userId: membership.userId,
    type: membership.type,
    status,
    startedAt: membership.startedAt,
    expiresAt,
  });

  const [certificate] = await db.select().from(coreCertificates).where(eq(coreCertificates.membershipId, applicationId)).limit(1);
  if (certificate) {
    await upsertCanonicalCertificate(db, {
      id: certificate.id,
      membershipId: applicationId,
      certificateNumber: certificate.certificateNumber,
      certificateUrl: certificate.certificateUrl,
      issuedAt: certificate.issuedAt,
      expiresAt,
    });
  }
}

async function handleMemberCheckoutSession(session: Stripe.Checkout.Session) {
  const applicationId = session.metadata?.applicationId || session.metadata?.orderId;
  if (!applicationId) {
    return;
  }

  const result = await ensurePaidApplication(
    applicationId,
    session.id,
    typeof session.subscription === "string" ? session.subscription : null,
    typeof session.payment_intent === "string" ? session.payment_intent : null,
    typeof session.invoice === "string" ? session.invoice : null,
  );

  if (!result) {
    return;
  }

  const secureToken = typeof result.application.paymentLink === "string"
    ? (result.application.paymentLink.match(/\/payment-link\/([^/?#]+)/)?.[1] || "")
    : "";

  try {
    if (secureToken) {
      await sendDashboardActivationEmail({
        email: result.application.email,
        name: result.application.fullName,
        secureToken,
      });
    }
    await sendAdminPaymentReceivedEmail({
      applicationId,
      email: result.application.email,
      name: result.application.fullName,
      membershipCategory: result.application.packageName,
      stripeSessionId: session.id,
    });
  } catch (error) {
    console.error("[Stripe Webhook] Failed to send member payment emails", error);
  }
}

async function handlePartnerApplicationCheckoutSession(session: Stripe.Checkout.Session) {
  const applicationId = session.metadata?.partnerApplicationId || session.metadata?.partner_application_id;
  if (!applicationId) {
    return;
  }

  const result = await ensurePaidApplication(
    applicationId,
    session.id,
    typeof session.subscription === "string" ? session.subscription : null,
    typeof session.payment_intent === "string" ? session.payment_intent : null,
    typeof session.invoice === "string" ? session.invoice : null,
  );

  if (!result) {
    return;
  }

  try {
    await sendAdminPaymentReceivedEmail({
      applicationId,
      email: result.application.email,
      name: result.application.fullName,
      membershipCategory: result.application.packageName,
      stripeSessionId: session.id,
    });
  } catch (error) {
    console.error("[Stripe Webhook] Failed to send partner payment email", error);
  }
}

webhooksRouter.post("/stripe", bodyParser.raw({ type: "*/*" }), async (req, res) => {
  const db = requireDb();
  const signature = normalizeStripeSignatureHeader(req.headers["stripe-signature"]);
  const payloadBuffer = getRawBodyBuffer(req.body);
  const secrets = getStripeWebhookSecrets();

  if (!signature || !payloadBuffer) {
    return res.status(400).send("Missing Stripe signature or raw payload");
  }
  if (secrets.length === 0) {
    return res.status(503).send("Stripe webhook secrets are not configured");
  }

  let event: Stripe.Event | null = null;
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(payloadBuffer, signature, secret);
      break;
    } catch {
      // Try the next configured secret.
    }
  }

  if (!event) {
    return res.status(400).send("Webhook signature verification failed");
  }

  try {
    if (await hasProcessedStripeEvent(db, event.id)) {
      return res.status(200).json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.orderKind === "membership") {
          await handleMemberCheckoutSession(session);
        } else if (session.metadata?.orderKind === "partner_application") {
          await handlePartnerApplicationCheckoutSession(session);
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const applicationId = subscription.metadata?.applicationId || subscription.metadata?.orderId;
        if (applicationId) {
          const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
          await updateSubscriptionState(
            applicationId,
            subscription.status === "active" ? "ACTIVE" : "CANCELLED",
            currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
          );
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const applicationId = subscription.metadata?.applicationId || subscription.metadata?.orderId;
        if (applicationId) {
          await updateSubscriptionState(applicationId, "CANCELLED", new Date());
        }
        break;
      }
      default:
        break;
    }

    await markStripeEventProcessed(db, event);
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    return res.status(500).send("Webhook processing failed");
  }
});

webhooksRouter.post("/clerk", bodyParser.json({ type: "application/json" }), async (req, res) => {
  try {
    const eventType = typeof req.body?.type === "string" ? req.body.type : "";
    const data = asRecord(req.body?.data);
    const clerkUserId = typeof data.id === "string" ? data.id : "";
    const emailCandidates = Array.isArray(data.email_addresses)
      ? data.email_addresses
        .map((item) => asRecord(item).email_address)
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      : [];
    const primaryEmail = normalizeEmail(emailCandidates[0] || data.primary_email_address || data.email);

    if (!clerkUserId || !primaryEmail) {
      return res.status(200).json({ received: true, skipped: true });
    }

    const db = requireDb();
    const role = primaryEmail.includes("support@") || primaryEmail.includes("admin@") ? "ADMIN" : "MEMBER";
    const userResult = await ensureCanonicalUser(db, {
      clerkId: clerkUserId,
      email: primaryEmail,
      role,
      status: "ACTIVE",
    });

    const fullName = `${typeof data.first_name === "string" ? data.first_name : ""} ${typeof data.last_name === "string" ? data.last_name : ""}`.trim();
    const split = splitFullName(fullName);
    const existingMemberships = await db.select().from(coreMemberships).where(eq(coreMemberships.userId, userResult.record.id));

    if (existingMemberships.length === 0) {
      const usersByEmail = await db.select().from(coreUsers).where(eq(coreUsers.email, primaryEmail)).limit(1);
      const existingUser = usersByEmail[0];
      if (existingUser && existingUser.id !== userResult.record.id) {
        await db
          .update(coreMemberships)
          .set({ userId: userResult.record.id })
          .where(eq(coreMemberships.userId, existingUser.id));
        await db
          .update(coreApplications)
          .set({ userId: userResult.record.id })
          .where(eq(coreApplications.userId, existingUser.id));
        await db
          .update(corePayments)
          .set({ userId: userResult.record.id })
          .where(eq(corePayments.userId, existingUser.id));
        await db
          .update(coreTeams)
          .set({ ownerUserId: userResult.record.id })
          .where(eq(coreTeams.ownerUserId, existingUser.id));
      }
    }

    await upsertCanonicalProfile(db, {
      userId: userResult.record.id,
      firstName: split.firstName || null,
      lastName: split.lastName || null,
      avatarUrl: typeof data.image_url === "string" ? data.image_url : null,
    });

    if (eventType === "user.deleted") {
      await db
        .update(coreUsers)
        .set({ status: "INACTIVE" })
        .where(eq(coreUsers.id, userResult.record.id));
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("[Clerk Webhook] Error:", error);
    return res.status(500).json({ error: "Failed to process Clerk webhook" });
  }
});
