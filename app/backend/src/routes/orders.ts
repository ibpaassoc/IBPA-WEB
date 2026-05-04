import { Router } from "express";
import crypto from "crypto";
import { requireDb, orders, certificates } from "../lib/db";
import { desc, eq } from "drizzle-orm";
import { stripe } from "../services/stripe";
import { adminNotificationEmail, resend, resendFrom } from "../services/email";
import { adminClerkMiddleware, requireAdminAccess } from "../services/admin";
import { createRateLimiter, getClientAddress } from "../lib/rate-limit";

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
const applicationLimiter = createRateLimiter(4, 30 * 60 * 1000);
const applicationAgentLimiter = createRateLimiter(8, 30 * 60 * 1000);
const paymentLinkLimiter = createRateLimiter(4, 60 * 60 * 1000);
const paymentLinkAgentLimiter = createRateLimiter(8, 60 * 60 * 1000);

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

  const baseUrl = frontendUrl.replace(/\/$/, "");
  return `${baseUrl}/success?token=${encodeURIComponent(secureToken)}&session_id={CHECKOUT_SESSION_ID}`;
}

function generateCertificateNumber() {
  return `CERT-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

function getMembershipPriceId(category?: string | null) {
  const normalizedCategory = normalizeMembershipPackage(category) || "Professional";
  const key = MEMBERSHIP_PRICE_KEYS[normalizedCategory as keyof typeof MEMBERSHIP_PRICE_KEYS];
  if (!key) {
    throw new Error(`Unsupported membership category: ${category}`);
  }

  return getRequiredEnv(key);
}

function normalizeMembershipPackage(category?: unknown) {
  if (typeof category !== "string") {
    return null;
  }

  return (LEGACY_MEMBERSHIP_PACKAGES[category] || category) as keyof typeof MEMBERSHIP_PRICE_KEYS;
}

function getSponsorshipPriceId(tier?: string | null) {
  const key = SPONSORSHIP_PRICE_KEYS[(tier || "") as keyof typeof SPONSORSHIP_PRICE_KEYS];
  if (!key) {
    throw new Error(`Unsupported sponsorship tier: ${tier}`);
  }

  return getRequiredEnv(key);
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

async function sendApplicationReceivedEmail(params: {
  email: string;
  name: string;
  membershipPackage?: string | null;
}) {
  const { email, name, membershipPackage } = params;

  const response = await resend.emails.send({
    from: resendFrom,
    to: email,
    subject: "IBPA application received",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 24px; color: #0f172a;">
        <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #64748b;">
          International Beauty Professionals Association
        </p>
        <h1 style="margin: 0 0 20px; font-size: 28px; line-height: 1.1; text-transform: uppercase;">
          Your application has been received
        </h1>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">
          Hello ${name || "there"},
        </p>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">
          Thank you for submitting your application to IBPA${membershipPackage ? ` for the <strong>${membershipPackage}</strong> category` : ""}. Your profile is now under review by our board.
        </p>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">
          If your application is approved, we will send you the next email with payment and activation instructions.
        </p>
        <div style="margin: 24px 0; padding: 16px 18px; background: #f8fafc; border-radius: 18px;">
          <p style="margin: 0; font-size: 14px; line-height: 1.7; color: #475569;">
            This is a confirmation that your application was successfully submitted. No further action is required from you at this stage.
          </p>
        </div>
        <p style="margin: 0; font-size: 13px; line-height: 1.7; color: #64748b;">
          Need help? Contact us at <a href="mailto:info@ibpassociations.org" style="color: #0f172a;">info@ibpassociations.org</a>.
        </p>
      </div>
    `,
  });

  return response;
}

async function sendAdminNewApplicationEmail(params: {
  email: string;
  name: string;
  phone?: string | null;
  membershipPackage?: string | null;
  applicantType?: string | null;
  application?: Record<string, unknown> | null;
}) {
  const { email, name, phone, membershipPackage, applicantType, application } = params;
  const competitionSummary = [
    typeof application?.competitionName === "string" ? application.competitionName : null,
    typeof application?.competitionYear === "string" ? application.competitionYear : null,
    typeof application?.competitionResult === "string" ? application.competitionResult : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const organizationSummary = [
    typeof application?.otherOrganizationName === "string" ? application.otherOrganizationName : null,
    typeof application?.otherOrganizationStatus === "string" ? application.otherOrganizationStatus : null,
    typeof application?.otherOrganizationYears === "string" ? application.otherOrganizationYears : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const specializationSummary = Array.isArray(application?.specialization)
    ? application.specialization.filter((item): item is string => typeof item === "string" && item.trim().length > 0).join(", ")
    : typeof application?.specialization === "string"
      ? application.specialization
      : null;

  const importantFields = [
    ["Membership", membershipPackage],
    ["Applicant Type", applicantType],
    ["Phone", phone],
    ["City", typeof application?.city === "string" ? application.city : null],
    ["Country", typeof application?.country === "string" ? application.country : null],
    ["Subcategory / Specialization", specializationSummary],
    ["Other Specialization", typeof application?.specializationOther === "string" ? application.specializationOther : null],
    ["Experience", typeof application?.yearsExperience === "string" ? application.yearsExperience : null],
    ["Achievements", typeof application?.achievementsDesc === "string" ? application.achievementsDesc : null],
    ["Competition", competitionSummary || null],
    ["Speaker / Educator / Judge", typeof application?.speakerEducatorJudge === "string" ? application.speakerEducatorJudge : null],
    ["Publications", typeof application?.publicationsLinks === "string" ? application.publicationsLinks : null],
    ["Industry Contribution", typeof application?.contributionDesc === "string" ? application.contributionDesc : null],
    ["Professional Community", typeof application?.professionalCommunityYesNo === "string" ? application.professionalCommunityYesNo : null],
    ["Other Organizations", organizationSummary || null],
    ["Education Plan / Методичка", Array.isArray(application?.trainerEducationPlanFiles) ? `${application.trainerEducationPlanFiles.length} file(s)` : null],
    ["Certificate", Array.isArray(application?.trainerCertificateFiles) ? `${application.trainerCertificateFiles.length} file(s)` : null],
    ["Proof of Educator Experience", Array.isArray(application?.trainerExperienceProofFiles) ? `${application.trainerExperienceProofFiles.length} file(s)` : null],
    ["Instagram", typeof application?.instagramLink === "string" ? application.instagramLink : null],
    ["Website", typeof application?.websiteLink === "string" ? application.websiteLink : null],
  ].filter(([, value]) => value);

  const response = await resend.emails.send({
    from: resendFrom,
    to: adminNotificationEmail,
    subject: `New IBPA application: ${name || email}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 720px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 24px; color: #0f172a;">
        <p style="margin: 0 0 12px; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #64748b;">
          New IBPA application
        </p>
        <h1 style="margin: 0 0 20px; font-size: 28px; line-height: 1.1;">
          ${name || "New applicant"}
        </h1>
        <p style="margin: 0 0 18px; font-size: 16px; line-height: 1.7;">
          A new application was submitted on the IBPA website.
        </p>
        <div style="margin: 24px 0; padding: 16px 18px; background: #f8fafc; border-radius: 18px;">
          <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.7;"><strong>Email:</strong> ${email}</p>
          ${importantFields
            .map(
              ([label, value]) =>
                `<p style="margin: 0 0 8px; font-size: 14px; line-height: 1.7;"><strong>${label}:</strong> ${String(value)}</p>`,
            )
            .join("")}
        </div>
      </div>
    `,
  });

  return response;
}

async function sendApprovalEmail(params: {
  email: string;
  name: string;
  certificateNumber: string;
  checkoutUrl?: string | null;
  paymentLinkUrl?: string | null;
}) {
  const { email, name, certificateNumber, checkoutUrl, paymentLinkUrl } = params;

  const response = await resend.emails.send({
    from: resendFrom,
    to: email,
    subject: "Your IBPA application has been approved",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 20px;">
        <h2 style="color: #333; text-transform: uppercase;">Congratulations, ${name}!</h2>
        <p>Your application for professional certification <b>${certificateNumber}</b> has been approved.</p>
        <p>To complete the process, please pay the registration fee using the link below:</p>
        <div style="margin: 30px 0;">
          <a href="${checkoutUrl}" style="background-color: #B9D9EB; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; text-transform: uppercase;">Pay with Stripe</a>
        </div>
        ${paymentLinkUrl ? `
        <div style="margin: 0 0 18px;">
          <a href="${paymentLinkUrl}" style="display: inline-block; color: #64748b; padding: 0; text-decoration: underline; font-size: 12px; font-weight: 600;">
            Link not working? Get a fresh payment link
          </a>
        </div>
        ` : ""}
        <p style="color: #666; font-size: 14px;">If the button does not work, copy this link: <br/> ${checkoutUrl}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">You received this email because you submitted an application on the IBPA website.</p>
      </div>
    `,
  });

  return response;
}

async function sendDashboardActivationEmail(params: {
  email: string;
  name: string;
  secureToken: string;
}) {
  const { email, name, secureToken } = params;
  const dashboardUrl = process.env.DASHBOARD_URL || process.env.FRONTEND_URL || "";
  const activationUrl = `${dashboardUrl.replace(/\/$/, "")}/success?token=${encodeURIComponent(secureToken)}`;

  return resend.emails.send({
    from: resendFrom,
    to: email,
    subject: "Complete your IBPA dashboard access",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 24px; color: #0f172a;">
        <h1 style="margin: 0 0 18px; font-size: 30px; line-height: 1.1;">Payment confirmed</h1>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">Hello ${name || "there"},</p>
        <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.7;">Your IBPA payment has been received. The final step is to activate your personal dashboard using the same email address you used in your application.</p>
        <div style="margin: 28px 0;">
          <a href="${activationUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 14px 24px; border-radius: 12px; text-decoration: none; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;">Open dashboard access</a>
        </div>
        <p style="margin: 0 0 12px; font-size: 14px; line-height: 1.7; color: #475569;">If you already have an account, sign in. If not, create one with this email: <strong>${email}</strong>.</p>
      </div>
    `,
  });
}

async function ensureCertificateRecord(orderId: string, preferredCertificateNumber?: string) {
  const db = requireDb();
  const [existingCert] = await db.select().from(certificates).where(eq(certificates.orderId, orderId));

  if (existingCert) {
    return existingCert.certNumber;
  }

  const certNumber = preferredCertificateNumber || generateCertificateNumber();
  await db.insert(certificates).values({
    orderId,
    certNumber,
  });

  return certNumber;
}

async function createMembershipCheckoutSession(params: {
  order: {
    id: string;
    email: string;
    name: string;
    membershipCategory: string | null;
    secureToken: string;
    status: string;
  };
  certificateNumber?: string;
}) {
  const { order, certificateNumber } = params;

  if (order.status === "paid") {
    throw new Error("This order has already been paid.");
  }

  const db = requireDb();
  const resolvedCertificateNumber = await ensureCertificateRecord(order.id, certificateNumber);
  const priceId = getMembershipPriceId(order.membershipCategory);
  const paymentLinkUrl = getPaymentLinkUrl(order.secureToken);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    customer_email: order.email,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: getSuccessUrl(order.secureToken),
    cancel_url: `${process.env.DASHBOARD_URL || process.env.FRONTEND_URL}/`,
    subscription_data: {
      metadata: {
        orderId: order.id,
        orderKind: "membership",
        certificateNumber: resolvedCertificateNumber,
      },
    },
    metadata: {
      orderId: order.id,
      orderKind: "membership",
      certificateNumber: resolvedCertificateNumber,
    },
  });

  await db
    .update(orders)
    .set({ status: "approved", stripeSessionId: session.id })
    .where(eq(orders.id, order.id));

  return {
    session,
    certificateNumber: resolvedCertificateNumber,
    paymentLinkUrl,
  };
}

async function sendReviewEmail(params: {
  email: string;
  name: string;
}) {
  const { email, name } = params;

  return resend.emails.send({
    from: resendFrom,
    to: email,
    subject: "Your IBPA application requires additional review",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 20px;">
        <h2 style="color: #333; text-transform: uppercase;">Hello, ${name}!</h2>
        <p>Your IBPA application is currently under additional review.</p>
        <p>Our team may need a little more time to verify the details and finalize the decision. We will contact you as soon as the review is complete.</p>
        <p style="color: #666; font-size: 14px;">If you have questions, reply to this email or contact us at info@ibpassociations.org.</p>
      </div>
    `,
  });
}

async function sendRejectedEmail(params: {
  email: string;
  name: string;
}) {
  const { email, name } = params;

  return resend.emails.send({
    from: resendFrom,
    to: email,
    subject: "Your IBPA application was not approved",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 20px;">
        <h2 style="color: #333; text-transform: uppercase;">Hello, ${name}!</h2>
        <p>Thank you for your interest in IBPA and for taking the time to complete your application.</p>
        <p>After review, we are unable to approve your application at this time.</p>
        <p>This decision does not prevent you from applying again in the future if your qualifications, materials, or professional profile change.</p>
        <p style="color: #666; font-size: 14px;">If you have questions, reply to this email or contact us at info@ibpassociations.org.</p>
      </div>
    `,
  });
}

// 0. Get all orders (for admin)
ordersRouter.get("/", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  try {
    const db = requireDb();
    const allOrders = await db.select().from(orders);
    res.json(allOrders);
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

ordersRouter.patch("/admin/applications/:id", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const id = getSingleValue(req.params.id);
  const membershipCategory = normalizeMembershipPackage(req.body?.membershipCategory);

  if (!id) {
    return res.status(400).json({ error: "Invalid application id" });
  }

  if (typeof membershipCategory !== "string" || !ALLOWED_MEMBERSHIP_PACKAGES.has(membershipCategory)) {
    return res.status(400).json({ error: "Unsupported membership category." });
  }

  try {
    const db = requireDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, id));

    if (!order) {
      return res.status(404).json({ error: "Application not found" });
    }

    const applicationPayload =
      order.applicationPayload && typeof order.applicationPayload === "object" && !Array.isArray(order.applicationPayload)
        ? (order.applicationPayload as Record<string, unknown>)
        : {};
    const applicantType = MEMBERSHIP_APPLICANT_TYPES[membershipCategory];

    const [updatedApplication] = await db
      .update(orders)
      .set({
        membershipCategory,
        package: membershipCategory,
        applicantType,
        applicationPayload: {
          ...applicationPayload,
          membershipCategory,
          applicantType,
        },
      })
      .where(eq(orders.id, id))
      .returning();

    return res.json({ success: true, application: updatedApplication });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

    console.error("Failed to update application membership category", error);
    return res.status(500).json({ error: "Failed to update application membership category" });
  }
});

ordersRouter.patch("/:id", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const id = getSingleValue(req.params.id);
  const membershipCategory = normalizeMembershipPackage(req.body?.membershipCategory);

  if (!id) {
    return res.status(400).json({ error: "Invalid application id" });
  }

  if (typeof membershipCategory !== "string" || !ALLOWED_MEMBERSHIP_PACKAGES.has(membershipCategory)) {
    return res.status(400).json({ error: "Unsupported membership category." });
  }

  try {
    const db = requireDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, id));

    if (!order) {
      return res.status(404).json({ error: "Application not found" });
    }

    const applicationPayload =
      order.applicationPayload && typeof order.applicationPayload === "object" && !Array.isArray(order.applicationPayload)
        ? (order.applicationPayload as Record<string, unknown>)
        : {};
    const applicantType = MEMBERSHIP_APPLICANT_TYPES[membershipCategory];

    const [updatedApplication] = await db
      .update(orders)
      .set({
        membershipCategory,
        package: membershipCategory,
        applicantType,
        applicationPayload: {
          ...applicationPayload,
          membershipCategory,
          applicantType,
        },
      })
      .where(eq(orders.id, id))
      .returning();

    return res.json({ success: true, application: updatedApplication });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

    console.error("Failed to update application membership category", error);
    return res.status(500).json({ error: "Failed to update application membership category" });
  }
});

// 1. Create order
ordersRouter.post("/", async (req, res) => {
  const {
    email,
    name,
    package: rawMembershipPackage,
    applicantType,
    application,
    phone,
    honeypot,
  } = req.body;
  const membershipPackage = normalizeMembershipPackage(rawMembershipPackage);
  const secureToken = crypto.randomUUID();

  if (typeof honeypot === "string" && honeypot.trim()) {
    return res.json({ success: true });
  }

  const clientIp = getClientAddress(req);
  const safeEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const userAgent = normalizeHeaderValue(req.header("user-agent"));

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 120) {
    return res.status(400).json({ error: "Please provide a valid applicant name." });
  }

  if (typeof membershipPackage !== "string" || !ALLOWED_MEMBERSHIP_PACKAGES.has(membershipPackage)) {
    return res.status(400).json({ error: "Unsupported membership package." });
  }

  if (typeof application !== "object" || application === null || Array.isArray(application)) {
    return res.status(400).json({ error: "Application payload is required." });
  }

  const normalizedApplication: Record<string, unknown> = {
    ...(application as Record<string, unknown>),
    membershipCategory: membershipPackage,
  };

  const ipLimit = applicationLimiter.hit(`orders:ip:${clientIp}`);
  const emailLimit = applicationLimiter.hit(`orders:email:${safeEmail}`);
  const agentLimit = applicationAgentLimiter.hit(`orders:agent:${userAgent}`);

  if (!ipLimit.allowed || !emailLimit.allowed || !agentLimit.allowed) {
    return res.status(429).json({ error: "Too many application attempts. Please try again later." });
  }

  const db = requireDb();
  const [recentDuplicate] = await db
    .select({
      id: orders.id,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(eq(orders.email, safeEmail))
    .orderBy(desc(orders.createdAt))
    .limit(1);

  if (recentDuplicate && Date.now() - new Date(recentDuplicate.createdAt).getTime() < 5 * 60 * 1000) {
    return res.status(409).json({ error: "A recent application already exists for this email. Please wait a few minutes before trying again." });
  }

  // Try to get phone from top-level body or fallback to application payload
  const applicantPhone = phone || (application ? application.phone : null);

  const portfolioImages =
    Array.isArray(normalizedApplication.portfolioImages)
      ? (normalizedApplication.portfolioImages as unknown[]).filter(
          (item): item is string => typeof item === "string" && item.length > 0,
        )
      : [];
  const trainerEducationPlanFiles =
    Array.isArray(normalizedApplication.trainerEducationPlanFiles)
      ? (normalizedApplication.trainerEducationPlanFiles as unknown[]).filter(
          (item): item is string => typeof item === "string" && item.length > 0,
        )
      : [];
  const trainerCertificateFiles =
    Array.isArray(normalizedApplication.trainerCertificateFiles)
      ? (normalizedApplication.trainerCertificateFiles as unknown[]).filter(
          (item): item is string => typeof item === "string" && item.length > 0,
        )
      : [];
  const trainerExperienceProofFiles =
    Array.isArray(normalizedApplication.trainerExperienceProofFiles)
      ? (normalizedApplication.trainerExperienceProofFiles as unknown[]).filter(
          (item): item is string => typeof item === "string" && item.length > 0,
        )
      : [];

  const categoryRequiresPortfolio =
    membershipPackage === "Specialist" ||
    membershipPackage === "Professional" ||
    membershipPackage === "Trainer";
  const categoryRequiresLicenseNumber = membershipPackage !== "Specialist";
  const categoryRequiresSubcategory =
    membershipPackage !== "Business" &&
    membershipPackage !== "Brand";
  const licenseNumber =
    typeof normalizedApplication.licenseNumber === "string" ? normalizedApplication.licenseNumber.trim() : "";
  const specializations =
    Array.isArray(normalizedApplication.specialization)
      ? (normalizedApplication.specialization as unknown[]).filter(
          (item): item is string => typeof item === "string" && item.trim().length > 0,
        )
      : [];
  const specializationOther =
    typeof normalizedApplication.specializationOther === "string"
      ? normalizedApplication.specializationOther.trim()
      : "";

  normalizedApplication.portfolioImages = portfolioImages;
  normalizedApplication.trainerEducationPlanFiles = trainerEducationPlanFiles;
  normalizedApplication.trainerCertificateFiles = trainerCertificateFiles;
  normalizedApplication.trainerExperienceProofFiles = trainerExperienceProofFiles;
  normalizedApplication.specialization = specializations;
  normalizedApplication.specializationOther = specializationOther;

  if (categoryRequiresPortfolio && (portfolioImages.length < 5 || portfolioImages.length > 10)) {
    return res.status(400).json({
      error: "Please provide between 5 and 10 portfolio images for this membership category.",
    });
  }

  if (categoryRequiresLicenseNumber && !licenseNumber) {
    return res.status(400).json({ error: "License number is required for this membership category." });
  }

  if (categoryRequiresSubcategory && specializations.length === 0) {
    return res.status(400).json({ error: "Please select at least one subcategory or specialization." });
  }

  if (categoryRequiresSubcategory && specializations.includes("Other") && !specializationOther) {
    return res.status(400).json({ error: "Please describe your other specialization." });
  }

  if (membershipPackage === "Trainer") {
    const studentCount = Number(
      (typeof normalizedApplication.studentCount === "string" ? normalizedApplication.studentCount : "")
        .match(/\d+/)?.[0] || 0,
    );

    if (studentCount < 5) {
      return res.status(400).json({ error: "Trainer applications require at least 5 students taught." });
    }

    if (trainerEducationPlanFiles.length < 1) {
      return res.status(400).json({ error: "Education plan / методичка is required for Trainer applications." });
    }

    if (trainerCertificateFiles.length < 1) {
      return res.status(400).json({ error: "Certificate upload is required for Trainer applications." });
    }

    if (trainerExperienceProofFiles.length < 5) {
      return res.status(400).json({ error: "Please upload at least 5 proof files for educator experience." });
    }
  }

  try {
    const [newOrder] = await db.insert(orders).values({
      email,
      name,
      phone: applicantPhone,
      membershipCategory: membershipPackage,
      package: membershipPackage,
      applicantType,
      applicationPayload: normalizedApplication,
      status: "pending",
      secureToken,
    }).returning();

    try {
      const emailResult = await sendApplicationReceivedEmail({
        email,
        name,
        membershipPackage,
      });
      console.log("Application confirmation email sent", {
        to: email,
        id: emailResult.data?.id ?? null,
        error: emailResult.error ?? null,
      });
    } catch (emailError) {
      console.error("Application confirmation email failed", {
        to: email,
        error: emailError,
      });
    }

    try {
      const adminEmailResult = await sendAdminNewApplicationEmail({
        email,
        name,
        phone: applicantPhone,
        membershipPackage,
        applicantType,
        application: normalizedApplication,
      });
      console.log("Admin application notification email sent", {
        to: adminNotificationEmail,
        id: adminEmailResult.data?.id ?? null,
        error: adminEmailResult.error ?? null,
      });
    } catch (emailError) {
      console.error("Admin application notification email failed", {
        to: adminNotificationEmail,
        error: emailError,
      });
    }

    res.json(newOrder);
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    res.status(500).json({ error: "Failed to create order" });
  }
});

ordersRouter.delete("/:id", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  try {
    const db = requireDb();
    const id = getSingleValue(req.params.id);

    if (!id) {
      return res.status(400).json({ error: "Invalid order id" });
    }

    await db.delete(certificates).where(eq(certificates.orderId, id));

    const [deletedOrder] = await db
      .delete(orders)
      .where(eq(orders.id, id))
      .returning();

    if (!deletedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json({ success: true, deletedOrder });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("Failed to delete order", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

// 2. Admin approve & create Stripe session
ordersRouter.post("/admin/approve", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const orderId = getSingleValue(req.body?.orderId);

  if (!orderId) {
    return res.status(400).json({ error: "Invalid order id" });
  }

  try {
    const db = requireDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return res.status(404).json({ error: "Order not found" });

    const { session, certificateNumber, paymentLinkUrl } = await createMembershipCheckoutSession({ order });

    // Send email via Resend
    try {
      const emailResult = await sendApprovalEmail({
        email: order.email,
        name: order.name,
        certificateNumber,
        checkoutUrl: session.url,
        paymentLinkUrl,
      });
      console.log("Approval email sent", {
        to: order.email,
        id: emailResult.data?.id ?? null,
        error: emailResult.error ?? null,
      });
    } catch (emailError) {
      console.error("Approval email failed", {
        to: order.email,
        error: emailError,
      });
      // We don't fail the whole request if email fails, but we log it
    }

    res.json({ success: true, certificateNumber, checkoutUrl: session.url, paymentLinkUrl });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error(error);
    res.status(500).json({ error: "Failed to approve order" });
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
    const [order] = await db.select().from(orders).where(eq(orders.secureToken, token));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status === "paid") {
      return res.status(409).json({ error: "This application has already been paid." });
    }

    if (order.status !== "approved") {
      return res.status(409).json({ error: "Payment link can only be regenerated after approval." });
    }

    const { session, certificateNumber, paymentLinkUrl } = await createMembershipCheckoutSession({ order });

    try {
      const emailResult = await sendApprovalEmail({
        email: order.email,
        name: order.name,
        certificateNumber,
        checkoutUrl: session.url,
        paymentLinkUrl,
      });
      console.log("[Payment Link] Fresh approval email sent", {
        to: order.email,
        id: emailResult.data?.id ?? null,
        error: emailResult.error ?? null,
      });
    } catch (emailError) {
      console.error("[Payment Link] Failed to send fresh approval email", {
        to: order.email,
        error: emailError,
      });
    }

    return res.json({
      success: true,
      checkoutUrl: session.url,
      paymentLinkUrl,
      certificateNumber,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

    console.error("[Payment Link] Failed to regenerate payment link", error);
    return res.status(500).json({ error: "Failed to regenerate payment link" });
  }
});

ordersRouter.post("/admin/review", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const orderId = getSingleValue(req.body?.orderId);

  if (!orderId) {
    return res.status(400).json({ error: "Invalid order id" });
  }

  try {
    const db = requireDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    await db
      .update(orders)
      .set({ status: "review" })
      .where(eq(orders.id, orderId));

    try {
      await sendReviewEmail({
        email: order.email,
        name: order.name,
      });
    } catch (emailError) {
      console.error("Additional review email failed", {
        to: order.email,
        error: emailError,
      });
    }

    return res.json({ success: true, status: "review" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

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
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    await db
      .update(orders)
      .set({ status: "rejected" })
      .where(eq(orders.id, orderId));

    try {
      await sendRejectedEmail({
        email: order.email,
        name: order.name,
      });
    } catch (emailError) {
      console.error("Rejected application email failed", {
        to: order.email,
        error: emailError,
      });
    }

    return res.json({ success: true, status: "rejected" });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

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
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${landingUrl}/partnership?payment=success&tier=${encodeURIComponent(tier)}`,
      cancel_url: `${landingUrl}/partnership?payment=cancelled&tier=${encodeURIComponent(tier)}`,
      metadata: {
        orderKind: "sponsorship",
        sponsorshipTier: tier,
      },
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
    const [order] = await db.select().from(orders).where(eq(orders.id, id));

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status === "paid") {
      return res.status(409).json({ error: "This application has already been paid." });
    }

    if (order.status !== "approved") {
      return res.status(409).json({ error: "Payment link can only be regenerated after approval." });
    }

    const { session, certificateNumber, paymentLinkUrl } = await createMembershipCheckoutSession({ order });

    try {
      const emailResult = await sendApprovalEmail({
        email: order.email,
        name: order.name,
        certificateNumber,
        checkoutUrl: session.url,
        paymentLinkUrl,
      });
      console.log("[Admin] Fresh payment link email sent", {
        to: order.email,
        id: emailResult.data?.id ?? null,
        error: emailResult.error ?? null,
      });
    } catch (emailError) {
      console.error("[Admin] Failed to send fresh payment link email", {
        to: order.email,
        error: emailError,
      });
    }

    res.json({
      success: true,
      checkoutUrl: session.url,
      paymentLinkUrl,
      certificateNumber,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("Failed to resend payment link", error);
    res.status(500).json({ error: "Failed to resend payment link" });
  }
});

// 3. Verify token
ordersRouter.get("/verify/:token", async (req, res) => {
  const token = getSingleValue(req.params.token);
  const stripeSessionId = getSingleValue(req.query.session_id);

  if (!token) {
    return res.status(400).json({ error: "Invalid verification token" });
  }

  try {
    const db = requireDb();
    const [order] = await db.select().from(orders).where(eq(orders.secureToken, token));
    if (!order) return res.status(404).json({ error: "Order not found" });

    const checkoutSessionId = stripeSessionId || order.stripeSessionId;

    if (order.status !== "paid" && checkoutSessionId?.startsWith("cs_")) {
      const session = await stripe.checkout.sessions.retrieve(checkoutSessionId);
      const sessionOrderId = session.metadata?.orderId;
      const sessionOrderKind = session.metadata?.orderKind;
      const isPaidSession =
        session.status === "complete" &&
        (session.payment_status === "paid" || session.payment_status === "no_payment_required");

      if (sessionOrderId === order.id && sessionOrderKind === "membership" && isPaidSession) {
        const [paidOrder] = await db
          .update(orders)
          .set({ status: "paid", stripeSessionId: session.id })
          .where(eq(orders.id, order.id))
          .returning();

        try {
          const emailResult = await sendDashboardActivationEmail({
            email: order.email,
            name: order.name,
            secureToken: order.secureToken,
          });
          console.log("[Verify Payment] Dashboard activation email sent", {
            to: order.email,
            id: emailResult.data?.id ?? null,
            error: emailResult.error ?? null,
          });
        } catch (emailError) {
          console.error("[Verify Payment] Failed to send dashboard activation email", {
            to: order.email,
            error: emailError,
          });
        }

        return res.json(paidOrder || { ...order, status: "paid", stripeSessionId: session.id });
      }

      console.warn("[Verify Payment] Stripe session did not match paid order", {
        orderId: order.id,
        stripeSessionId: checkoutSessionId,
        sessionOrderId,
        sessionOrderKind,
        sessionStatus: session.status,
        paymentStatus: session.payment_status,
      });
    }

    res.json(order);
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("[Verify Payment] Verification failed", error);
    res.status(500).json({ error: "Verification failed" });
  }
});

// 4. Save uploaded certificate URL
ordersRouter.post("/:id/certificate", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const id = getSingleValue(req.params.id);
  const { url } = req.body;

  if (!id) {
    return res.status(400).json({ error: "Invalid order id" });
  }

  try {
    const db = requireDb();
    const [existingCert] = await db
      .select({ id: certificates.id })
      .from(certificates)
      .where(eq(certificates.orderId, id));

    if (!existingCert) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    await db.update(certificates)
      .set({ certificateUrl: url })
      .where(eq(certificates.orderId, id));
    res.json({ success: true, certificateUrl: url });
  } catch (error) {
    console.error("Failed to save certificate URL:", error);
    res.status(500).json({ error: "Failed to save certificate URL" });
  }
});

ordersRouter.delete("/:id/certificate", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const id = getSingleValue(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "Invalid order id" });
  }

  try {
    const db = requireDb();
    const [existingCert] = await db
      .select({ id: certificates.id })
      .from(certificates)
      .where(eq(certificates.orderId, id));

    if (!existingCert) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    await db
      .update(certificates)
      .set({ certificateUrl: null })
      .where(eq(certificates.orderId, id));

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to remove certificate URL:", error);
    res.status(500).json({ error: "Failed to remove certificate URL" });
  }
});

// 5. Resend PDF to client
ordersRouter.post("/:id/resend-pdf", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  const id = getSingleValue(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "Invalid order id" });
  }

  try {
    const db = requireDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    const [cert] = await db.select().from(certificates).where(eq(certificates.orderId, id));

    if (!order || !cert || !cert.certificateUrl) {
      return res.status(404).json({ error: "Order or certificate URL not found" });
    }

    const emailResult = await resend.emails.send({
      from: resendFrom,
      to: order.email,
      subject: "Ваш физический сертификат IBPA готов",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 20px;">
          <h2 style="color: #333; text-transform: uppercase;">Здравствуйте, ${order.name}!</h2>
          <p>Ваш цифровой сертификат <b>${cert.certNumber}</b> был загружен и теперь доступен для скачивания.</p>
          <div style="margin: 30px 0;">
            <a href="${cert.certificateUrl}" style="background-color: #B9D9EB; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; text-transform: uppercase;">Скачать сертификат (PDF)</a>
          </div>
          <p style="color: #666; font-size: 14px;">Если кнопка не работает, скопируйте эту ссылку: <br/> ${cert.certificateUrl}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">С уважением, команда IBPA.</p>
        </div>
      `,
    });

    if (emailResult.error) {
      throw new Error(emailResult.error.message);
    }

    res.json({ success: true });
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("Failed to resend PDF:", error);
    res.status(500).json({ error: "Failed to resend PDF: " + (error.message || "") });
  }
});
