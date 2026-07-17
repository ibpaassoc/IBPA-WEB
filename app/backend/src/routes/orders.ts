import crypto from "crypto";
import { Router } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { requireDb } from "../lib/db";
import {
  coreApplications,
  coreCertificates,
  coreFiles,
  coreMemberships,
  corePayments,
  coreUsers,
} from "../lib/schema";
import { stripe } from "../services/stripe";
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
import { ensureCanonicalUser } from "../features/users/server/user.service";
import { upsertCanonicalApplication, findCanonicalApplicationById, upsertCanonicalApplicationFile, deleteCanonicalApplicationFilesExcept, deleteCanonicalApplicationAggregate, listCanonicalApplicationFileRecords } from "../features/applications/server/application.repository";
import { upsertCanonicalPayment } from "../features/payments/server/payment.repository";
import { upsertCanonicalMembership } from "../features/memberships/server/membership.repository";
import { upsertCanonicalCertificate } from "../features/certificates/server/certificate.repository";
import { syncProfileFromApplication } from "../features/profiles/server/application-profile-sync";

export const ordersRouter = Router();

const MEMBERSHIP_PRICE_KEYS = {
  Specialist: "STRIPE_PRICE_SPECIALIST",
  Professional: "STRIPE_PRICE_PROFESSIONAL",
  Trainer: "STRIPE_PRICE_TRAINER",
  Business: "STRIPE_PRICE_BUSINESS",
  Brand: "STRIPE_PRICE_BRAND",
} as const;

const LEGACY_MEMBERSHIP_PACKAGES: Record<string, keyof typeof MEMBERSHIP_PRICE_KEYS> = {
  Student: "Specialist",
};

const MEMBERSHIP_APPLICANT_TYPES: Record<keyof typeof MEMBERSHIP_PRICE_KEYS, string> = {
  Specialist: "Individual",
  Professional: "Individual",
  Trainer: "School",
  Business: "Business",
  Brand: "Brand",
};

const SPONSORSHIP_PRICE_KEYS = {
  Associate: "STRIPE_PRICE_SPONSOR_ASSOCIATE",
  Community: "STRIPE_PRICE_SPONSOR_COMMUNITY",
  Premier: "STRIPE_PRICE_SPONSOR_PREMIER",
} as const;

const ALLOWED_MEMBERSHIP_PACKAGES = new Set(Object.keys(MEMBERSHIP_PRICE_KEYS));
const ALLOWED_ADDITIONAL_FILE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "pdf", "doc", "docx"]);
const applicationLimiter = createRateLimiter(4, 30 * 60 * 1000);
const applicationAgentLimiter = createRateLimiter(8, 30 * 60 * 1000);
const paymentLinkLimiter = createRateLimiter(4, 60 * 60 * 1000);
const paymentLinkAgentLimiter = createRateLimiter(8, 60 * 60 * 1000);

const ADMIN_ORDER_LIST_DEFAULT_LIMIT = 20;
const ADMIN_ORDER_LIST_MAX_LIMIT = 50;
const ADMIN_ORDER_STATUSES = new Set(["pending", "review", "rejected", "approved", "paid"]);

type AdditionalFileInput = {
  fileName: string;
  fileUrl: string;
  fileKey: string | null;
  fileType: string;
};

function normalizeMembershipPackage(category?: unknown) {
  if (typeof category !== "string") {
    return null;
  }

  return (LEGACY_MEMBERSHIP_PACKAGES[category] || category) as keyof typeof MEMBERSHIP_PRICE_KEYS;
}

function normalizeOrderAccountType(value: unknown, fallback: "member" | "partner" = "member") {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "partner" ? "partner" : fallback;
}

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function getFrontendBaseUrl() {
  return (process.env.FRONTEND_URL || "").replace(/\/$/, "");
}

function getPaymentLinkUrl(secureToken: string) {
  const frontendUrl = getFrontendBaseUrl();
  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not configured");
  }
  return `${frontendUrl}/payment-link/${encodeURIComponent(secureToken)}`;
}

function getSuccessUrl(secureToken: string) {
  const frontendUrl = process.env.DASHBOARD_URL || process.env.FRONTEND_URL;
  if (!frontendUrl) {
    throw new Error("DASHBOARD_URL or FRONTEND_URL is not configured");
  }
  return `${frontendUrl.replace(/\/$/, "")}/success?token=${encodeURIComponent(secureToken)}&session_id={CHECKOUT_SESSION_ID}`;
}

function getMembershipPriceId(category?: string | null) {
  const normalizedCategory = normalizeMembershipPackage(category) || "Professional";
  const key = MEMBERSHIP_PRICE_KEYS[normalizedCategory as keyof typeof MEMBERSHIP_PRICE_KEYS];
  if (!key) {
    throw new Error(`Unsupported membership category: ${category}`);
  }
  return getRequiredEnv(key);
}

function getSponsorshipPriceId(tier?: string | null) {
  const key = SPONSORSHIP_PRICE_KEYS[(tier || "") as keyof typeof SPONSORSHIP_PRICE_KEYS];
  if (!key) {
    throw new Error(`Unsupported sponsorship tier: ${tier}`);
  }
  return getRequiredEnv(key);
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

function getSingleValue(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : null;
  return null;
}

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

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getFileExtension(fileNameOrUrl: string) {
  const cleanValue = fileNameOrUrl.split("?")[0]?.split("#")[0] || "";
  return cleanValue.split(".").pop()?.toLowerCase() || "";
}

function isAllowedAdditionalFile(fileName: string, fileUrl: string) {
  return ALLOWED_ADDITIONAL_FILE_EXTENSIONS.has(getFileExtension(fileName))
    || ALLOWED_ADDITIONAL_FILE_EXTENSIONS.has(getFileExtension(fileUrl));
}

function generateCertificateNumber() {
  return `CERT-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function textValue(value: unknown) {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  return "";
}

function humanizeApplicationField(field: string) {
  return field
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
}

function validateOrganizationApplication(
  membershipPackage: keyof typeof MEMBERSHIP_PRICE_KEYS,
  payload: Record<string, unknown>,
) {
  if (membershipPackage !== "Business" && membershipPackage !== "Brand") {
    return null;
  }

  const requiredText = (fields: string[]) => {
    const missing = fields.find((field) => typeof payload[field] !== "string" || !String(payload[field]).trim());
    return missing ? `${humanizeApplicationField(missing)} is required.` : null;
  };
  const requiredFiles = (field: string, minimum: number) => {
    const value = payload[field];
    return Array.isArray(value) && value.filter((item) => typeof item === "string" && item.trim()).length >= minimum
      ? null
      : `${humanizeApplicationField(field)} requires at least ${minimum} file${minimum === 1 ? "" : "s"}.`;
  };
  const requiredSelections = (field: string) => {
    const value = payload[field];
    return Array.isArray(value) && value.some((item) => typeof item === "string" && item.trim())
      ? null
      : `Select at least one ${humanizeApplicationField(field).toLowerCase()}.`;
  };
  const requiredAgreements = [
    "certifyTrue",
    "additionalDocumentationConsent",
    "agreeStandards",
    "understandReview",
    "privacyConsent",
  ];
  const missingAgreement = requiredAgreements.find((field) => payload[field] !== true);
  if (missingAgreement) {
    return `${humanizeApplicationField(missingAgreement)} must be accepted.`;
  }

  if (membershipPackage === "Business") {
    const textError = requiredText([
      "firstName", "lastName", "dateOfBirth", "country", "city", "phone", "email", "businessCurrentPosition",
      "yearsExperience", "professionalBiography", "professionalExperience", "professionalEducation", "professionalAchievements",
      "bizName", "bizType", "bizYear", "businessCountry", "businessCity", "businessAddress", "businessWebsite",
      "businessInstagram", "bizTeamSize", "businessDescription", "bizServices", "businessAchievements", "businessMission",
      "businessIndustryContribution", "businessMediaFeatured", "businessPublications", "businessSpeakingExperience",
      "businessJudgingExperience", "whyJoin", "contributionDesc",
    ]);
    if (textError) return textError;
    if (payload.businessCurrentPosition === "Other") {
      const error = requiredText(["businessCurrentPositionOther"]);
      if (error) return error;
    }
    if (payload.bizType === "Other") {
      const error = requiredText(["bizTypeOther"]);
      if (error) return error;
    }
    if (payload.businessMediaFeatured === "Yes") {
      const error = requiredText(["businessMediaDescription"]);
      if (error) return error;
    }
    return requiredFiles("businessProfilePhotoFiles", 1)
      || requiredFiles("businessProfessionalCertificationFiles", 1)
      || requiredFiles("businessSupportingDocumentFiles", 1)
      || requiredFiles("businessPortfolioImages", 5)
      || requiredFiles("businessClientTestimonialFiles", 5);
  }

  const textError = requiredText([
    "brandName", "brandType", "brandYear", "brandRegistrationCountry", "brandCity", "brandAddress", "brandWebsite",
    "brandInstagram", "brandSocialWebsite", "brandPrimaryContact", "brandContactPosition", "brandContactEmail", "brandContactPhone",
    "brandDescription", "brandMission", "brandValues", "brandProductsServices", "brandOperatingCountries", "brandEmployeeCount",
    "brandAchievements", "brandPublicationsYesNo", "brandExhibitionsYesNo", "brandIndustryContribution", "whyJoin",
  ]);
  if (textError) return textError;
  if (payload.brandType === "Other") {
    const error = requiredText(["brandTypeOther"]);
    if (error) return error;
  }
  if (payload.brandContactPosition === "Other") {
    const error = requiredText(["brandContactPositionOther"]);
    if (error) return error;
  }
  if (payload.brandPublicationsYesNo === "Yes") {
    const error = requiredText(["brandPublicationsDetails"]);
    if (error) return error;
  }
  if (payload.brandExhibitionsYesNo === "Yes") {
    const error = requiredText(["brandExhibitionsDetails"]);
    if (error) return error;
  }

  const selectionError = requiredSelections("brandProductCategories")
    || requiredSelections("brandCertifications")
    || requiredSelections("brandCooperationMethods")
    || requiredSelections("brandMemberBenefits");
  if (selectionError) return selectionError;
  if ((payload.brandProductCategories as unknown[]).includes("Other")) {
    const error = requiredText(["brandProductCategoryOther"]);
    if (error) return error;
  }
  if ((payload.brandCertifications as unknown[]).includes("Other")) {
    const error = requiredText(["brandCertificationOther"]);
    if (error) return error;
  }
  if ((payload.brandCooperationMethods as unknown[]).includes("Other")) {
    const error = requiredText(["brandCooperationOther"]);
    if (error) return error;
  }
  if ((payload.brandMemberBenefits as unknown[]).includes("Other")) {
    const error = requiredText(["brandMemberBenefitOther"]);
    if (error) return error;
  }

  return requiredFiles("brandReviewFiles", 5)
    || requiredFiles("brandProductFiles", 1)
    || requiredFiles("brandAchievementDocumentFiles", 5)
    || requiredFiles("brandSupportingDocumentFiles", 1);
}

function mapCanonicalStatusToLegacy(status: string | null | undefined) {
  switch ((status || "").toUpperCase()) {
    case "UNDER_REVIEW":
      return "review";
    case "REJECTED":
      return "rejected";
    case "APPROVED":
    case "PAYMENT_SENT":
      return "approved";
    case "PAID":
      return "paid";
    default:
      return "pending";
  }
}

function getApplicationPaymentToken(application: typeof coreApplications.$inferSelect) {
  const link = application.paymentLink || "";
  const match = link.match(/\/payment-link\/([^/?#]+)/i);
  return match?.[1] || null;
}

function getApplicationCertificateNumber(application: typeof coreApplications.$inferSelect | null) {
  const payload = asRecord(application?.applicationData);
  const certificateNumber = payload.certificateNumber;
  return typeof certificateNumber === "string" && certificateNumber.trim() ? certificateNumber.trim() : null;
}

function toVerificationResponse(application: typeof coreApplications.$inferSelect, payment: typeof corePayments.$inferSelect | null) {
  return {
    id: application.id,
    email: application.email,
    name: application.fullName,
    membershipCategory: application.packageName,
    applicantType: MEMBERSHIP_APPLICANT_TYPES[(application.packageName || "Professional") as keyof typeof MEMBERSHIP_PRICE_KEYS] || "Individual",
    accountType: "member",
    status: mapCanonicalStatusToLegacy(application.status),
    stripeSessionId: payment?.stripeSessionId ?? null,
    createdAt: application.createdAt,
  };
}

async function sendApplicationReceivedEmail(params: { email: string; name: string; membershipPackage?: string | null; }) {
  return sendEmail({
    from: APPLICATIONS_SENDER,
    to: params.email,
    replyTo: APPLICATIONS_REPLY_TO,
    subject: "IBPA application received",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 24px; color: #0f172a;">
        <h1 style="margin: 0 0 20px; font-size: 28px; line-height: 1.1; text-transform: uppercase;">Your application has been received</h1>
        <p>Hello ${escapeHtml(params.name || "there")},</p>
        <p>Thank you for submitting your application to IBPA${params.membershipPackage ? ` for the <strong>${escapeHtml(params.membershipPackage)}</strong> category` : ""}. Your profile is now under review by our board.</p>
      </div>
    `,
  });
}

async function sendAdminNewApplicationEmail(params: { email: string; name: string; phone?: string | null; membershipPackage?: string | null; applicantType?: string | null; }) {
  return sendEmail({
    from: APPLICATIONS_SENDER,
    to: adminNotificationEmail,
    replyTo: APPLICATIONS_REPLY_TO,
    subject: `New IBPA application: ${params.name || params.email}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 720px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 24px; color: #0f172a;">
        <h1 style="margin: 0 0 20px; font-size: 28px; line-height: 1.1;">${escapeHtml(params.name || "New applicant")}</h1>
        <p><strong>Email:</strong> ${escapeHtml(params.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(params.phone || "")}</p>
        <p><strong>Membership:</strong> ${escapeHtml(params.membershipPackage || "")}</p>
        <p><strong>Applicant type:</strong> ${escapeHtml(params.applicantType || "")}</p>
      </div>
    `,
  });
}

async function sendApprovalEmail(params: { email: string; name: string; certificateNumber: string; checkoutUrl?: string | null; paymentLinkUrl?: string | null; }) {
  return sendEmail({
    from: APPLICATIONS_SENDER,
    to: params.email,
    replyTo: APPLICATIONS_REPLY_TO,
    subject: "Your IBPA application has been approved",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 20px;">
        <h2 style="color: #333; text-transform: uppercase;">Congratulations, ${escapeHtml(params.name)}!</h2>
        <p>Your application for professional certification <b>${escapeHtml(params.certificateNumber)}</b> has been approved.</p>
        <p>To complete the process, please pay the registration fee using the link below:</p>
        <div style="margin: 30px 0;">
          <a href="${escapeHtml(params.checkoutUrl || "#")}" style="background-color: #B9D9EB; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; text-transform: uppercase;">Pay with Stripe</a>
        </div>
        ${params.paymentLinkUrl ? `<p><a href="${escapeHtml(params.paymentLinkUrl)}">Need a fresh payment link?</a></p>` : ""}
      </div>
    `,
  });
}

async function sendAdminPaymentLinkSentEmail(params: { email: string; name: string; orderId: string; membershipCategory?: string | null; checkoutUrl?: string | null; }) {
  return sendEmail({
    from: PAYMENTS_SENDER,
    to: adminNotificationEmail,
    replyTo: PAYMENTS_REPLY_TO,
    subject: `IBPA payment link sent: ${params.name || params.email}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 20px; color: #0f172a;">
        <p><strong>Applicant:</strong> ${escapeHtml(params.name || "Unknown")}</p>
        <p><strong>Email:</strong> ${escapeHtml(params.email)}</p>
        <p><strong>Membership:</strong> ${escapeHtml(params.membershipCategory || "N/A")}</p>
        <p><strong>Order ID:</strong> ${escapeHtml(params.orderId)}</p>
        ${params.checkoutUrl ? `<p><a href="${escapeHtml(params.checkoutUrl)}">Stripe checkout link</a></p>` : ""}
      </div>
    `,
  });
}

async function sendReviewEmail(params: { email: string; name: string; requestedChanges: string; editToken: string; }) {
  const frontendUrl = getFrontendBaseUrl();
  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not configured");
  }
  const editUrl = `${frontendUrl}/application/edit?token=${encodeURIComponent(params.editToken)}`;

  return sendEmail({
    from: APPLICATIONS_SENDER,
    to: params.email,
    replyTo: APPLICATIONS_REPLY_TO,
    subject: "Your IBPA application requires additional review",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 20px; color: #0f172a;">
        <p>Hello ${escapeHtml(params.name || "there")},</p>
        <p>Our review team needs a few updates to your IBPA application before we can continue.</p>
        <p style="white-space: pre-wrap; padding: 16px; background: #f8fafc; border-radius: 12px;"><strong>Requested changes:</strong><br>${escapeHtml(params.requestedChanges)}</p>
        <p>Please use the button below to edit your full application and upload any updated files. When you submit it, your application will return to the review queue.</p>
        <p style="margin: 28px 0;"><a href="${escapeHtml(editUrl)}" style="display: inline-block; background: #1F5D8F; color: #fff; padding: 14px 22px; border-radius: 10px; text-decoration: none; font-weight: bold;">Edit application</a></p>
      </div>
    `,
  });
}

async function sendRejectedEmail(params: { email: string; name: string; }) {
  return sendEmail({
    from: APPLICATIONS_SENDER,
    to: params.email,
    replyTo: APPLICATIONS_REPLY_TO,
    subject: "Your IBPA application was not approved",
    html: `<div style="font-family: Arial, sans-serif; padding: 20px;"><p>Hello ${escapeHtml(params.name || "there")},</p><p>After review, we are unable to approve your application at this time.</p></div>`,
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

async function sendAdminPaymentReceivedEmail(params: { email: string; name: string; orderId: string; membershipCategory?: string | null; stripeSessionId?: string | null; }) {
  return sendEmail({
    from: PAYMENTS_SENDER,
    to: adminNotificationEmail,
    replyTo: PAYMENTS_REPLY_TO,
    subject: `IBPA payment received: ${params.name || params.email}`,
    html: `<div style="font-family: Arial, sans-serif; padding: 20px;"><p><strong>Applicant:</strong> ${escapeHtml(params.name || "Unknown")}</p><p><strong>Email:</strong> ${escapeHtml(params.email)}</p><p><strong>Membership:</strong> ${escapeHtml(params.membershipCategory || "N/A")}</p><p><strong>Order ID:</strong> ${escapeHtml(params.orderId)}</p><p><strong>Stripe session:</strong> ${escapeHtml(params.stripeSessionId || "N/A")}</p></div>`,
  });
}

async function loadMemberApplicationAggregate(db: ReturnType<typeof requireDb>, applicationId: string) {
  const [application, payment, membership, certificate] = await Promise.all([
    db.select().from(coreApplications).where(and(eq(coreApplications.id, applicationId), eq(coreApplications.type, "MEMBER"))).limit(1).then((rows: typeof coreApplications.$inferSelect[]) => rows[0] ?? null),
    db.select().from(corePayments).where(eq(corePayments.id, applicationId)).limit(1).then((rows: typeof corePayments.$inferSelect[]) => rows[0] ?? null),
    db.select().from(coreMemberships).where(eq(coreMemberships.id, applicationId)).limit(1).then((rows: typeof coreMemberships.$inferSelect[]) => rows[0] ?? null),
    db.select().from(coreCertificates).where(eq(coreCertificates.membershipId, applicationId)).limit(1).then((rows: typeof coreCertificates.$inferSelect[]) => rows[0] ?? null),
  ]);

  return { application, payment, membership, certificate };
}

async function ensureCertificateNumber(application: typeof coreApplications.$inferSelect) {
  const current = getApplicationCertificateNumber(application);
  if (current) {
    return current;
  }

  const nextCertificateNumber = generateCertificateNumber();
  const nextPayload = {
    ...asRecord(application.applicationData),
    certificateNumber: nextCertificateNumber,
  };

  const db = requireDb();
  await db
    .update(coreApplications)
    .set({ applicationData: nextPayload })
    .where(eq(coreApplications.id, application.id));

  return nextCertificateNumber;
}

async function createMembershipCheckoutSession(params: { application: typeof coreApplications.$inferSelect; payment?: typeof corePayments.$inferSelect | null; }) {
  const { application, payment } = params;
  const status = mapCanonicalStatusToLegacy(application.status);
  if (status === "paid") {
    throw new Error("This order has already been paid.");
  }

  const certificateNumber = await ensureCertificateNumber(application);
  const token = getApplicationPaymentToken(application) || crypto.randomUUID();
  const paymentLinkUrl = getPaymentLinkUrl(token);
  const priceId = getMembershipPriceId(application.packageName);
  const metadata = {
    orderId: application.id,
    orderKind: "membership",
    certificateNumber,
    applicationId: application.id,
    applicantEmail: application.email,
    applicationType: application.packageName || "membership",
    environment: process.env.NODE_ENV || "development",
  };

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: application.email,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: getSuccessUrl(token),
    cancel_url: `${process.env.DASHBOARD_URL || process.env.FRONTEND_URL}/`,
    subscription_data: { metadata },
    metadata,
  });

  const db = requireDb();
  await upsertCanonicalPayment(db, {
    id: application.id,
    userId: application.userId ?? payment?.userId ?? null,
    type: "membership",
    stripeSessionId: session.id,
    amount: 0,
    status: "PENDING",
    createdAt: payment?.createdAt ?? application.createdAt,
    paidAt: null,
  });
  await db
    .update(coreApplications)
    .set({
      status: "PAYMENT_SENT",
      paymentLink: `/payment-link/${token}`,
      applicationData: {
        ...asRecord(application.applicationData),
        certificateNumber,
      },
    })
    .where(eq(coreApplications.id, application.id));

  return {
    session,
    certificateNumber,
    paymentLinkUrl,
  };
}

async function getMembershipSubscriptionExpiry(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;
  if (!currentPeriodEnd) {
    throw new Error(`Unable to determine current_period_end for subscription ${subscriptionId}`);
  }
  return new Date(currentPeriodEnd * 1000);
}

async function markApplicationPaid(params: {
  application: typeof coreApplications.$inferSelect;
  stripeSessionId: string;
  subscriptionId?: string | null;
}) {
  const db = requireDb();
  const userResult = await ensureCanonicalUser(db, {
    email: params.application.email,
    clerkId: null,
    role: "MEMBER",
    status: "ACTIVE",
  });
  const expiresAt = params.subscriptionId ? await getMembershipSubscriptionExpiry(params.subscriptionId) : null;
  const certificateNumber = getApplicationCertificateNumber(params.application) || generateCertificateNumber();

  await db
    .update(coreApplications)
    .set({
      userId: userResult.record.id,
      status: "PAID",
      applicationData: {
        ...asRecord(params.application.applicationData),
        certificateNumber,
      },
    })
    .where(eq(coreApplications.id, params.application.id));

  await upsertCanonicalPayment(db, {
    id: params.application.id,
    userId: userResult.record.id,
    type: "membership",
    stripeSessionId: params.stripeSessionId,
    amount: 0,
    status: "PAID",
    createdAt: params.application.createdAt,
    paidAt: new Date(),
  });

  await upsertCanonicalMembership(db, {
    id: params.application.id,
    userId: userResult.record.id,
    type: params.application.packageName || "Professional",
    status: "ACTIVE",
    startedAt: new Date(),
    expiresAt,
  });

  await upsertCanonicalCertificate(db, {
    id: params.application.id,
    membershipId: params.application.id,
    certificateNumber,
    issuedAt: new Date(),
    expiresAt,
  });

  // Populate the member profile from the application payload (verify/:token
  // reconciliation path, mirrors the Stripe webhook handler).
  await syncProfileFromApplication(db, {
    userId: userResult.record.id,
    application: {
      id: params.application.id,
      type: params.application.type,
      fullName: params.application.fullName,
      phone: params.application.phone,
      packageName: params.application.packageName,
      applicationData: {
        ...asRecord(params.application.applicationData),
        certificateNumber,
      },
    },
  });

  return {
    user: userResult.record,
    certificateNumber,
    expiresAt,
  };
}

// List/summary projection only. The heavy `applicationData` JSON payload (and the
// derived payment token) are intentionally NOT selected here — the list view never reads
// them, and full detail loads on demand via GET /api/orders/:id. Keeping the list lean
// also keeps /admin/mailing's audience fetch (/api/orders?limit=500) cheap.
async function buildAdminOrderRows(db: ReturnType<typeof requireDb>) {
  const rows = await db
    .select({
      id: coreApplications.id,
      email: coreApplications.email,
      fullName: coreApplications.fullName,
      packageName: coreApplications.packageName,
      status: coreApplications.status,
      createdAt: coreApplications.createdAt,
      stripeSessionId: corePayments.stripeSessionId,
      certificateNumber: coreCertificates.certificateNumber,
    })
    .from(coreApplications)
    .leftJoin(corePayments, eq(corePayments.id, coreApplications.id))
    .leftJoin(coreCertificates, eq(coreCertificates.membershipId, coreApplications.id))
    .where(eq(coreApplications.type, "MEMBER"))
    .orderBy(desc(coreApplications.createdAt));

  return rows.map((row: any) => ({
    id: row.id,
    email: row.email,
    name: row.fullName,
    membershipCategory: row.packageName,
    applicantType: MEMBERSHIP_APPLICANT_TYPES[(row.packageName || "Professional") as keyof typeof MEMBERSHIP_PRICE_KEYS] || "Individual",
    status: mapCanonicalStatusToLegacy(row.status),
    stripeSessionId: row.stripeSessionId ?? null,
    checkoutUrl: null,
    createdAt: row.createdAt,
    certificateNumber: row.certificateNumber ?? null,
  }));
}

ordersRouter.get("/", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  try {
    const db = requireDb();
    const { limit, offset } = getPaginationParams(req.query, ADMIN_ORDER_LIST_DEFAULT_LIMIT, ADMIN_ORDER_LIST_MAX_LIMIT);
    const statusFilter = typeof req.query.status === "string" && ADMIN_ORDER_STATUSES.has(req.query.status) ? req.query.status : null;
    const search = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";

    const rows = await buildAdminOrderRows(db);
    const filtered = rows.filter((row: any) => {
      const matchesStatus = !statusFilter || row.status === statusFilter;
      const matchesSearch = !search
        || [row.name, row.email, row.membershipCategory, row.certificateNumber]
          .some((value) => String(value || "").toLowerCase().includes(search));
      return matchesStatus && matchesSearch;
    });

    const summary = {
      all: filtered.length,
      pending: filtered.filter((row: any) => row.status === "pending").length,
      review: filtered.filter((row: any) => row.status === "review").length,
      rejected: filtered.filter((row: any) => row.status === "rejected").length,
      approved: filtered.filter((row: any) => row.status === "approved").length,
      paid: filtered.filter((row: any) => row.status === "paid").length,
    };
    const items = filtered.slice(offset, offset + limit);

    return res.json({
      items,
      total: filtered.length,
      summary,
      limit,
      offset,
      hasMore: offset + items.length < filtered.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("Failed to fetch orders:", error);
    return res.status(500).json({ error: "Failed to fetch orders" });
  }
});

function getAdditionalReviewDetails(application: typeof coreApplications.$inferSelect) {
  const review = asRecord(asRecord(application.applicationData).additionalReview);
  return {
    editToken: textValue(review.editToken),
    requestedChanges: textValue(review.requestedChanges),
  };
}

async function findApplicationForReviewEditToken(db: ReturnType<typeof requireDb>, token: string) {
  const applications = await db
    .select()
    .from(coreApplications)
    .where(and(eq(coreApplications.type, "MEMBER"), eq(coreApplications.status, "UNDER_REVIEW")));

  return applications.find((application: typeof coreApplications.$inferSelect) => getAdditionalReviewDetails(application).editToken === token) ?? null;
}

ordersRouter.get("/review-edit", async (req, res) => {
  const token = getSingleValue(req.query?.token)?.trim() || "";
  if (!token) {
    return res.status(400).json({ error: "Invalid application edit link." });
  }

  try {
    const application = await findApplicationForReviewEditToken(requireDb(), token);
    if (!application) {
      return res.status(404).json({ error: "This application edit link is invalid or has already been used." });
    }

    const review = getAdditionalReviewDetails(application);
    return res.json({
      application: application.applicationData,
      requestedChanges: review.requestedChanges,
    });
  } catch (error) {
    console.error("Failed to load application for additional review edit", error);
    return res.status(500).json({ error: "Could not load this application." });
  }
});

ordersRouter.patch("/review-edit", async (req, res) => {
  const token = getSingleValue(req.body?.token)?.trim() || "";
  const applicationData = req.body?.application;
  const membershipPackage = normalizeMembershipPackage(req.body?.package);
  const safeEmail = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const safeName = typeof req.body?.name === "string" ? req.body.name.trim() : "";

  if (!token || !applicationData || typeof applicationData !== "object" || Array.isArray(applicationData)) {
    return res.status(400).json({ error: "Invalid application update." });
  }
  if (!isValidEmail(safeEmail) || safeName.length < 2 || safeName.length > 120) {
    return res.status(400).json({ error: "Please provide a valid name and email address." });
  }
  if (!membershipPackage || !ALLOWED_MEMBERSHIP_PACKAGES.has(membershipPackage)) {
    return res.status(400).json({ error: "Unsupported membership package." });
  }
  const organizationValidationError = validateOrganizationApplication(
    membershipPackage,
    applicationData as Record<string, unknown>,
  );
  if (organizationValidationError) {
    return res.status(400).json({ error: organizationValidationError });
  }

  try {
    const db = requireDb();
    const existing = await findApplicationForReviewEditToken(db, token);
    if (!existing) {
      return res.status(404).json({ error: "This application edit link is invalid or has already been used." });
    }

    const userResult = await ensureCanonicalUser(db, {
      email: safeEmail,
      clerkId: null,
      role: "MEMBER",
      status: "ACTIVE",
    });

    const existingPayload = asRecord(existing.applicationData);
    const normalizedApplication = {
      ...(applicationData as Record<string, unknown>),
      membershipCategory: membershipPackage,
      accountType: "member",
      applicantType: MEMBERSHIP_APPLICANT_TYPES[membershipPackage],
      additionalReview: {
        ...asRecord(existingPayload.additionalReview),
        editToken: null,
        resubmittedAt: new Date().toISOString(),
      },
    };
    const applicantPhone = textValue(
      (applicationData as Record<string, unknown>).phone
      ?? (applicationData as Record<string, unknown>).brandContactPhone,
    ).slice(0, 50) || null;

    await db
      .update(coreApplications)
      .set({
        fullName: safeName,
        email: safeEmail,
        userId: userResult.record.id,
        packageName: membershipPackage,
        phone: applicantPhone,
        applicationData: normalizedApplication,
        status: "SUBMITTED",
      })
      .where(eq(coreApplications.id, existing.id));

    return res.json({ success: true, status: "pending" });
  } catch (error) {
    console.error("Failed to save additional review application update", error);
    return res.status(500).json({ error: "Could not save your application changes." });
  }
});

ordersRouter.get("/:id", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  try {
    const id = getSingleValue(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "Invalid application id" });
    }

    const db = requireDb();
    const { application, payment, certificate } = await loadMemberApplicationAggregate(db, id);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    return res.json({
      id: application.id,
      email: application.email,
      name: application.fullName,
      membershipCategory: application.packageName,
      applicantType: MEMBERSHIP_APPLICANT_TYPES[(application.packageName || "Professional") as keyof typeof MEMBERSHIP_PRICE_KEYS] || "Individual",
      applicationPayload: application.applicationData,
      status: mapCanonicalStatusToLegacy(application.status),
      stripeSessionId: payment?.stripeSessionId ?? null,
      createdAt: application.createdAt,
      certificateNumber: certificate?.certificateNumber ?? getApplicationCertificateNumber(application),
    });
  } catch (error) {
    console.error("Failed to fetch order detail", error);
    return res.status(500).json({ error: "Failed to fetch order detail" });
  }
});

async function updateMembershipCategory(req: any, res: any) {
  const id = getSingleValue(req.params.id);
  const membershipCategory = normalizeMembershipPackage(req.body?.membershipCategory);
  const accountType = normalizeOrderAccountType(req.body?.accountType);

  if (!id) {
    return res.status(400).json({ error: "Invalid application id" });
  }
  if (typeof membershipCategory !== "string" || !ALLOWED_MEMBERSHIP_PACKAGES.has(membershipCategory)) {
    return res.status(400).json({ error: "Unsupported membership category." });
  }

  try {
    const db = requireDb();
    const [application] = await db.select().from(coreApplications).where(eq(coreApplications.id, id)).limit(1);
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const nextPayload = {
      ...asRecord(application.applicationData),
      membershipCategory,
      applicantType: MEMBERSHIP_APPLICANT_TYPES[membershipCategory],
      accountType,
    };

    const [updatedApplication] = await db
      .update(coreApplications)
      .set({
        packageName: membershipCategory,
        applicationData: nextPayload,
      })
      .where(eq(coreApplications.id, id))
      .returning();

    return res.json({ success: true, application: updatedApplication });
  } catch (error) {
    console.error("Failed to update application membership category", error);
    return res.status(500).json({ error: "Failed to update application membership category" });
  }
}

ordersRouter.patch("/admin/applications/:id", adminClerkMiddleware, requireAdminAccess, updateMembershipCategory);
ordersRouter.patch("/:id", adminClerkMiddleware, requireAdminAccess, updateMembershipCategory);

ordersRouter.post("/", async (req, res) => {
  const { email, name, package: rawMembershipPackage, application, phone, honeypot } = req.body;
  const membershipPackage = normalizeMembershipPackage(rawMembershipPackage);
  const secureToken = crypto.randomUUID();

  if (typeof honeypot === "string" && honeypot.trim()) {
    return res.json({ success: true });
  }

  const clientIp = getClientAddress(req);
  const safeEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const safeName = typeof name === "string" ? name.trim() : "";
  const userAgent = normalizeHeaderValue(req.header("user-agent"));

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }
  if (safeName.length < 2 || safeName.length > 120) {
    return res.status(400).json({ error: "Please provide a valid applicant name." });
  }
  if (typeof membershipPackage !== "string" || !ALLOWED_MEMBERSHIP_PACKAGES.has(membershipPackage)) {
    return res.status(400).json({ error: "Unsupported membership package." });
  }
  if (typeof application !== "object" || application === null || Array.isArray(application)) {
    return res.status(400).json({ error: "Application payload is required." });
  }
  const organizationValidationError = validateOrganizationApplication(
    membershipPackage,
    application as Record<string, unknown>,
  );
  if (organizationValidationError) {
    return res.status(400).json({ error: organizationValidationError });
  }

  const ipLimit = applicationLimiter.hit(`orders:ip:${clientIp}`);
  const emailLimit = applicationLimiter.hit(`orders:email:${safeEmail}`);
  const agentLimit = applicationAgentLimiter.hit(`orders:agent:${userAgent}`);
  if (!ipLimit.allowed || !emailLimit.allowed || !agentLimit.allowed) {
    return res.status(429).json({ error: "Too many application attempts. Please try again later." });
  }

  try {
    const db = requireDb();
    const existing = await db
      .select({ id: coreApplications.id, createdAt: coreApplications.createdAt })
      .from(coreApplications)
      .where(and(eq(coreApplications.email, safeEmail), eq(coreApplications.type, "MEMBER")))
      .orderBy(desc(coreApplications.createdAt))
      .limit(1);

    if (existing[0] && Date.now() - new Date(existing[0].createdAt).getTime() < 5 * 60 * 1000) {
      return res.status(409).json({ error: "A recent application already exists for this email. Please wait a few minutes before trying again." });
    }

    const userResult = await ensureCanonicalUser(db, {
      email: safeEmail,
      clerkId: null,
      role: "MEMBER",
      status: "ACTIVE",
    });

    const normalizedApplication: Record<string, unknown> = {
      ...(application as Record<string, unknown>),
      membershipCategory: membershipPackage,
      accountType: "member",
      applicantType: MEMBERSHIP_APPLICANT_TYPES[membershipPackage],
    };

    const applicantPhone =
      typeof (phone ?? normalizedApplication.phone) === "string" && textValue(phone ?? normalizedApplication.phone)
        ? textValue(phone ?? normalizedApplication.phone).slice(0, 50)
        : null;

    const created = await upsertCanonicalApplication(db, {
      id: crypto.randomUUID(),
      userId: userResult.record.id,
      type: "MEMBER",
      packageName: membershipPackage,
      status: "SUBMITTED",
      fullName: safeName,
      email: safeEmail,
      phone: applicantPhone,
      paymentLink: `/payment-link/${secureToken}`,
      applicationData: normalizedApplication,
      applicationFiles: [],
      approvedAt: null,
      createdAt: new Date(),
    });

    try {
      await sendApplicationReceivedEmail({ email: safeEmail, name: safeName, membershipPackage });
      await sendAdminNewApplicationEmail({
        email: safeEmail,
        name: safeName,
        phone: applicantPhone,
        membershipPackage,
        applicantType: MEMBERSHIP_APPLICANT_TYPES[membershipPackage],
      });
    } catch (emailError) {
      console.error("Application emails failed", emailError);
    }

    return res.status(201).json(created.record);
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("[Order Create] failed", error);
    return res.status(500).json({ error: "Failed to create order" });
  }
});

ordersRouter.get("/:id/additional-files", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const id = getSingleValue(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid application id" });
  }

  try {
    const db = requireDb();
    const [application] = await db.select({ id: coreApplications.id }).from(coreApplications).where(eq(coreApplications.id, id));
    if (!application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const files = await listCanonicalApplicationFileRecords(db, id);
    return res.json({
      files: files.map((file: any) => ({
        id: file.id,
        applicationId: id,
        fileName: file.fileName || "Attachment",
        fileUrl: file.fileUrl,
        fileKey: null,
        fileType: "attachment",
        createdAt: file.createdAt,
      })),
    });
  } catch (error) {
    console.error("Failed to list additional files", error);
    return res.status(500).json({ error: "Failed to list additional files" });
  }
});

ordersRouter.post("/:id/additional-files", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const id = getSingleValue(req.params.id);
  const incomingFiles: unknown[] = Array.isArray(req.body?.files) ? req.body.files : [req.body];
  if (!id) {
    return res.status(400).json({ error: "Invalid application id" });
  }

  const files: AdditionalFileInput[] = incomingFiles
    .map((file) => {
      const record = file && typeof file === "object" ? file as Record<string, unknown> : {};
      const fileName = typeof record.fileName === "string" ? record.fileName.trim() : "";
      const fileUrl = typeof record.fileUrl === "string" ? record.fileUrl.trim() : "";
      const fileType = typeof record.fileType === "string" ? record.fileType.trim() : "attachment";
      const fileKey = typeof record.fileKey === "string" ? record.fileKey.trim() : null;
      if (!fileName || !fileUrl || !isAllowedAdditionalFile(fileName, fileUrl)) {
        return null;
      }
      return { fileName, fileUrl, fileKey, fileType };
    })
    .filter((item): item is AdditionalFileInput => Boolean(item));

  if (files.length === 0) {
    return res.status(400).json({ error: "At least one valid file is required." });
  }

  try {
    const db = requireDb();
    const aggregate = await loadMemberApplicationAggregate(db, id);
    if (!aggregate.application) {
      return res.status(404).json({ error: "Application not found" });
    }

    const createdFiles = [];
    for (const file of files) {
      const created = await upsertCanonicalApplicationFile(db, {
        id: crypto.randomUUID(),
        ownerUserId: aggregate.application.userId ?? null,
        applicationId: id,
        fileUrl: file.fileUrl,
        fileName: file.fileName,
      });
      createdFiles.push(created);
    }

    const allFiles = await listCanonicalApplicationFileRecords(db, id);
    await db
      .update(coreApplications)
      .set({
        applicationFiles: allFiles.map((file: any) => ({
          id: file.id,
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          fileType: "attachment",
          createdAt: file.createdAt.toISOString(),
        })),
      })
      .where(eq(coreApplications.id, id));

    return res.status(201).json({
      files: createdFiles.map((file) => ({
        id: file.id,
        applicationId: id,
        fileName: file.fileName || "Attachment",
        fileUrl: file.fileUrl,
        fileKey: null,
        fileType: "attachment",
        createdAt: file.createdAt,
      })),
    });
  } catch (error) {
    console.error("Failed to add additional application file", error);
    return res.status(500).json({ error: "Failed to add additional file" });
  }
});

ordersRouter.delete("/:id/additional-files/:fileId", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const id = getSingleValue(req.params.id);
  const fileId = getSingleValue(req.params.fileId);
  if (!id || !fileId) {
    return res.status(400).json({ error: "Invalid application file id" });
  }

  try {
    const db = requireDb();
    const allFiles = await listCanonicalApplicationFileRecords(db, id);
    const remaining = allFiles.filter((file: any) => file.id !== fileId);
    if (remaining.length === allFiles.length) {
      return res.status(404).json({ error: "File not found" });
    }

    await deleteCanonicalApplicationFilesExcept(db, {
      applicationId: id,
      keepIds: remaining.map((file: any) => file.id),
    });

    await db
      .update(coreApplications)
      .set({
        applicationFiles: remaining.map((file: any) => ({
          id: file.id,
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          fileType: "attachment",
          createdAt: file.createdAt.toISOString(),
        })),
      })
      .where(eq(coreApplications.id, id));

    return res.json({ success: true, deletedFile: { id: fileId } });
  } catch (error) {
    console.error("Failed to delete additional file", error);
    return res.status(500).json({ error: "Failed to delete additional file" });
  }
});

ordersRouter.delete("/:id", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  try {
    const db = requireDb();
    const id = getSingleValue(req.params.id);
    if (!id) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    const { application } = await loadMemberApplicationAggregate(db, id);
    if (!application) {
      return res.status(404).json({ error: "Order not found" });
    }

    await deleteCanonicalApplicationAggregate(db, id);
    return res.json({ success: true, deletedOrder: application });
  } catch (error) {
    console.error("Failed to delete order", error);
    return res.status(500).json({ error: "Failed to delete order" });
  }
});

ordersRouter.post("/admin/approve", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const orderId = getSingleValue(req.body?.orderId);
  if (!orderId) {
    return res.status(400).json({ error: "Invalid order id" });
  }

  try {
    const db = requireDb();
    const { application, payment } = await loadMemberApplicationAggregate(db, orderId);
    if (!application) {
      return res.status(404).json({ error: "Order not found" });
    }

    const { session, certificateNumber, paymentLinkUrl } = await createMembershipCheckoutSession({ application, payment });
    try {
      await sendApprovalEmail({
        email: application.email,
        name: application.fullName,
        certificateNumber,
        checkoutUrl: session.url,
        paymentLinkUrl,
      });
      await sendAdminPaymentLinkSentEmail({
        email: application.email,
        name: application.fullName,
        orderId: application.id,
        membershipCategory: application.packageName,
        checkoutUrl: session.url,
      });
    } catch (emailError) {
      console.error("Approval emails failed", emailError);
    }

    return res.json({ success: true, certificateNumber, checkoutUrl: session.url, paymentLinkUrl });
  } catch (error) {
    console.error("Failed to approve order", error);
    return res.status(500).json({ error: "Failed to approve order" });
  }
});

ordersRouter.post("/payment-link", async (req, res) => {
  const token = getSingleValue(req.body?.token);
  if (!token) {
    return res.status(400).json({ error: "Invalid verification token" });
  }

  const clientIp = getClientAddress(req);
  const userAgent = normalizeHeaderValue(req.headers["user-agent"]);
  const tokenLimit = paymentLinkLimiter.hit(`payment-link:token:${token}`);
  const ipLimit = paymentLinkLimiter.hit(`payment-link:ip:${clientIp}`);
  const agentLimit = paymentLinkAgentLimiter.hit(`payment-link:agent:${userAgent}`);
  if (!tokenLimit.allowed || !ipLimit.allowed || !agentLimit.allowed) {
    return res.status(429).json({ error: "Too many payment link attempts. Please try again later." });
  }

  try {
    const db = requireDb();
    const [application] = await db
      .select()
      .from(coreApplications)
      .where(and(eq(coreApplications.type, "MEMBER"), eq(coreApplications.paymentLink, `/payment-link/${token}`)))
      .limit(1);
    if (!application) {
      return res.status(404).json({ error: "Order not found" });
    }

    const { payment } = await loadMemberApplicationAggregate(db, application.id);
    if (mapCanonicalStatusToLegacy(application.status) === "paid") {
      return res.status(409).json({ error: "This application has already been paid." });
    }
    if (!["approved", "review"].includes(mapCanonicalStatusToLegacy(application.status)) && application.status !== "PAYMENT_SENT") {
      return res.status(409).json({ error: "Payment link can only be regenerated after approval." });
    }

    const { session, certificateNumber, paymentLinkUrl } = await createMembershipCheckoutSession({ application, payment });
    try {
      await sendApprovalEmail({
        email: application.email,
        name: application.fullName,
        certificateNumber,
        checkoutUrl: session.url,
        paymentLinkUrl,
      });
      await sendAdminPaymentLinkSentEmail({
        email: application.email,
        name: application.fullName,
        orderId: application.id,
        membershipCategory: application.packageName,
        checkoutUrl: session.url,
      });
    } catch (emailError) {
      console.error("[Payment Link] Failed to send fresh approval email", emailError);
    }

    return res.json({ success: true, checkoutUrl: session.url, paymentLinkUrl, certificateNumber });
  } catch (error) {
    console.error("[Payment Link] Failed to regenerate payment link", error);
    return res.status(500).json({ error: "Failed to regenerate payment link" });
  }
});

ordersRouter.post("/admin/review", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const orderId = getSingleValue(req.body?.orderId);
  const requestedChanges = textValue(req.body?.requestedChanges);
  if (!orderId) {
    return res.status(400).json({ error: "Invalid order id" });
  }
  if (requestedChanges.length < 3 || requestedChanges.length > 5000) {
    return res.status(400).json({ error: "Describe the requested changes in 3 to 5,000 characters." });
  }

  try {
    const db = requireDb();
    const [application] = await db.select().from(coreApplications).where(eq(coreApplications.id, orderId)).limit(1);
    if (!application) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (application.type !== "MEMBER") {
      return res.status(400).json({ error: "Additional review is only available for member applications." });
    }

    const editToken = crypto.randomUUID();
    const nextApplicationData = {
      ...asRecord(application.applicationData),
      additionalReview: {
        requestedChanges,
        editToken,
        requestedAt: new Date().toISOString(),
      },
    };
    await db
      .update(coreApplications)
      .set({
        status: "UNDER_REVIEW",
        applicationData: nextApplicationData,
      })
      .where(eq(coreApplications.id, orderId));
    try {
      await sendReviewEmail({
        email: application.email,
        name: application.fullName,
        requestedChanges,
        editToken,
      });
    } catch (emailError) {
      console.error("Additional review email failed", emailError);
      await db
        .update(coreApplications)
        .set({ status: application.status, applicationData: application.applicationData })
        .where(eq(coreApplications.id, orderId));
      return res.status(502).json({ error: "The edit request email could not be sent. The application was left unchanged." });
    }

    return res.json({ success: true, status: "review" });
  } catch (error) {
    console.error("Failed to move order into additional review", error);
    return res.status(500).json({ error: "Failed to move order into additional review" });
  }
});

ordersRouter.post("/admin/reject", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const orderId = getSingleValue(req.body?.orderId);
  if (!orderId) {
    return res.status(400).json({ error: "Invalid order id" });
  }

  try {
    const db = requireDb();
    const [application] = await db.select().from(coreApplications).where(eq(coreApplications.id, orderId)).limit(1);
    if (!application) {
      return res.status(404).json({ error: "Order not found" });
    }

    await db.update(coreApplications).set({ status: "REJECTED" }).where(eq(coreApplications.id, orderId));
    try {
      await sendRejectedEmail({ email: application.email, name: application.fullName });
    } catch (emailError) {
      console.error("Rejected application email failed", emailError);
    }

    return res.json({ success: true, status: "rejected" });
  } catch (error) {
    console.error("Failed to reject order", error);
    return res.status(500).json({ error: "Failed to reject order" });
  }
});

ordersRouter.post("/sponsorship/checkout", async (req, res) => {
  const tier = getSingleValue(req.body?.tier);
  if (!tier) {
    return res.status(400).json({ error: "Invalid sponsorship tier" });
  }

  try {
    const priceId = getSponsorshipPriceId(tier);
    const landingUrl = (process.env.FRONTEND_URL || "https://ibpassociations.org").replace(/\/$/, "");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${landingUrl}/partnership?payment=success&tier=${encodeURIComponent(tier)}`,
      cancel_url: `${landingUrl}/partnership?payment=cancelled&tier=${encodeURIComponent(tier)}`,
      metadata: { orderKind: "sponsorship", sponsorshipTier: tier },
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create sponsorship checkout session", error);
    return res.status(500).json({ error: "Failed to create sponsorship checkout session" });
  }
});

ordersRouter.post("/:id/resend-payment-link", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const id = getSingleValue(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid order id" });
  }

  try {
    const db = requireDb();
    const { application, payment } = await loadMemberApplicationAggregate(db, id);
    if (!application) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (mapCanonicalStatusToLegacy(application.status) === "paid") {
      return res.status(409).json({ error: "This application has already been paid." });
    }

    const { session, certificateNumber, paymentLinkUrl } = await createMembershipCheckoutSession({ application, payment });
    try {
      await sendApprovalEmail({
        email: application.email,
        name: application.fullName,
        certificateNumber,
        checkoutUrl: session.url,
        paymentLinkUrl,
      });
      await sendAdminPaymentLinkSentEmail({
        email: application.email,
        name: application.fullName,
        orderId: application.id,
        membershipCategory: application.packageName,
        checkoutUrl: session.url,
      });
    } catch (emailError) {
      console.error("[Admin] Failed to send fresh payment link email", emailError);
    }

    return res.json({ success: true, checkoutUrl: session.url, paymentLinkUrl, certificateNumber });
  } catch (error) {
    console.error("Failed to resend payment link", error);
    return res.status(500).json({ error: "Failed to resend payment link" });
  }
});

ordersRouter.get("/verify/:token", async (req, res) => {
  const token = getSingleValue(req.params.token);
  const stripeSessionId = getSingleValue(req.query.session_id);
  if (!token) {
    return res.status(400).json({ error: "Invalid verification token" });
  }

  try {
    const db = requireDb();
    const [application] = await db
      .select()
      .from(coreApplications)
      .where(and(eq(coreApplications.type, "MEMBER"), eq(coreApplications.paymentLink, `/payment-link/${token}`)))
      .limit(1);
    if (!application) {
      return res.status(404).json({ error: "Order not found" });
    }

    const { payment } = await loadMemberApplicationAggregate(db, application.id);
    const checkoutSessionId = stripeSessionId || payment?.stripeSessionId;

    if (application.status !== "PAID" && checkoutSessionId?.startsWith("cs_")) {
      const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
      const sessionOrderId = session.metadata?.orderId;
      const sessionOrderKind = session.metadata?.orderKind;
      const isPaidSession = session.status === "complete"
        && (session.payment_status === "paid" || session.payment_status === "no_payment_required");

      if (sessionOrderId === application.id && sessionOrderKind === "membership" && isPaidSession) {
        await markApplicationPaid({
          application,
          stripeSessionId: session.id,
          subscriptionId: typeof session.subscription === "string" ? session.subscription : null,
        });

        try {
          await sendDashboardActivationEmail({
            email: application.email,
            name: application.fullName,
            secureToken: token,
          });
          await sendAdminPaymentReceivedEmail({
            email: application.email,
            name: application.fullName,
            orderId: application.id,
            membershipCategory: application.packageName,
            stripeSessionId: session.id,
          });
        } catch (emailError) {
          console.error("Payment confirmation emails failed", emailError);
        }

        const refreshed = await loadMemberApplicationAggregate(db, application.id);
        if (refreshed.application) {
          return res.json(toVerificationResponse(refreshed.application, refreshed.payment));
        }
      }
    }

    return res.json(toVerificationResponse(application, payment));
  } catch (error) {
    console.error("Failed to verify token", error);
    return res.status(500).json({ error: "Failed to verify token" });
  }
});

ordersRouter.post("/:id/certificate", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const id = getSingleValue(req.params.id);
  const { url } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Invalid order id" });
  }

  try {
    const db = requireDb();
    const { application, membership, certificate } = await loadMemberApplicationAggregate(db, id);
    if (!application || !membership) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    await upsertCanonicalCertificate(db, {
      id,
      membershipId: membership.id,
      certificateNumber: certificate?.certificateNumber || getApplicationCertificateNumber(application) || generateCertificateNumber(),
      certificateUrl: url,
      issuedAt: certificate?.issuedAt ?? new Date(),
      expiresAt: certificate?.expiresAt ?? membership.expiresAt ?? null,
    });

    return res.json({ success: true, certificateUrl: url });
  } catch (error) {
    console.error("Failed to save certificate URL:", error);
    return res.status(500).json({ error: "Failed to save certificate URL" });
  }
});

ordersRouter.delete("/:id/certificate", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const id = getSingleValue(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid order id" });
  }

  try {
    const db = requireDb();
    const { application, membership, certificate } = await loadMemberApplicationAggregate(db, id);
    if (!application || !membership || !certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    await upsertCanonicalCertificate(db, {
      id,
      membershipId: membership.id,
      certificateNumber: certificate.certificateNumber,
      certificateUrl: null,
      issuedAt: certificate.issuedAt,
      expiresAt: certificate.expiresAt,
    });

    return res.json({ success: true });
  } catch (error) {
    console.error("Failed to remove certificate URL:", error);
    return res.status(500).json({ error: "Failed to remove certificate URL" });
  }
});

ordersRouter.post("/:id/resend-pdf", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const id = getSingleValue(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid order id" });
  }

  try {
    const db = requireDb();
    const { application, certificate } = await loadMemberApplicationAggregate(db, id);
    if (!application || !certificate || !certificate.certificateUrl) {
      return res.status(404).json({ error: "Order or certificate URL not found" });
    }

    const emailResult = await sendEmail({
      from: APPLICATIONS_SENDER,
      to: application.email,
      replyTo: APPLICATIONS_REPLY_TO,
      subject: "Your IBPA certificate is ready",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 20px;">
          <h2 style="color: #333; text-transform: uppercase;">Hello, ${escapeHtml(application.fullName)}!</h2>
          <p>Your digital certificate <b>${escapeHtml(certificate.certificateNumber)}</b> is available for download.</p>
          <div style="margin: 30px 0;">
            <a href="${escapeHtml(certificate.certificateUrl)}" style="background-color: #B9D9EB; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; text-transform: uppercase;">Download certificate (PDF)</a>
          </div>
        </div>
      `,
    });

    if (emailResult.error) {
      throw new Error(emailResult.error.message);
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("Failed to resend PDF:", error);
    return res.status(500).json({ error: "Failed to resend PDF: " + (error.message || "") });
  }
});
