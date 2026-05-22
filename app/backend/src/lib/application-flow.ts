import { and, desc, eq, sql } from "drizzle-orm";
import {
  memberApplications,
  orders,
  partnerApplications,
  users,
  type MemberApplication,
  type PartnerApplication,
} from "./schema";

export type ApplicationFlowType = "member_application" | "partner_application";

export type ApplicationStatus = "draft" | "submitted" | "under_review" | "approved" | "rejected";
export type ApplicationPaymentStatus = "pending" | "paid" | "failed" | "refunded" | "not_required";

export function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function toApplicationStatus(value: unknown, fallback: ApplicationStatus = "submitted"): ApplicationStatus {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "draft") return "draft";
  if (normalized === "submitted") return "submitted";
  if (normalized === "under_review" || normalized === "review") return "under_review";
  if (normalized === "approved") return "approved";
  if (normalized === "rejected") return "rejected";
  if (normalized === "pending") return "submitted";
  if (normalized === "paid") return "approved";

  return fallback;
}

export function toApplicationPaymentStatus(
  value: unknown,
  fallback: ApplicationPaymentStatus = "not_required",
): ApplicationPaymentStatus {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === "pending") return "pending";
  if (normalized === "paid") return "paid";
  if (normalized === "failed") return "failed";
  if (normalized === "refunded") return "refunded";
  if (normalized === "not_required") return "not_required";
  if (normalized === "unpaid") return "pending";

  return fallback;
}

export function toLegacyOrderStatus(
  status: ApplicationStatus,
  paymentStatus: ApplicationPaymentStatus,
): "pending" | "review" | "approved" | "rejected" | "paid" {
  if (paymentStatus === "paid") return "paid";
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "under_review") return "review";
  return "pending";
}

export function fromLegacyOrderStatus(
  status: unknown,
): { status: ApplicationStatus; paymentStatus: ApplicationPaymentStatus } {
  const normalized = typeof status === "string" ? status.trim().toLowerCase() : "";

  if (normalized === "paid") {
    return { status: "approved", paymentStatus: "paid" };
  }

  if (normalized === "approved") {
    return { status: "approved", paymentStatus: "pending" };
  }

  if (normalized === "review") {
    return { status: "under_review", paymentStatus: "not_required" };
  }

  if (normalized === "rejected") {
    return { status: "rejected", paymentStatus: "not_required" };
  }

  return { status: "submitted", paymentStatus: "not_required" };
}

export type ApplicationLookupResult =
  | { flowType: "member_application"; application: MemberApplication }
  | { flowType: "partner_application"; application: PartnerApplication };

export async function getApplicationByFlowType(
  db: any,
  flowType: ApplicationFlowType,
  applicationId: string,
): Promise<ApplicationLookupResult | null> {
  if (flowType === "member_application") {
    const [application] = await db
      .select()
      .from(memberApplications)
      .where(eq(memberApplications.id, applicationId))
      .limit(1);

    if (!application) {
      return null;
    }

    return {
      flowType,
      application,
    };
  }

  const [application] = await db
    .select()
    .from(partnerApplications)
    .where(eq(partnerApplications.id, applicationId))
    .limit(1);

  if (!application) {
    return null;
  }

  return {
    flowType,
    application,
  };
}

type UpdateApplicationPaymentStatusParams = {
  flowType: ApplicationFlowType;
  applicationId: string;
  status?: ApplicationStatus;
  paymentStatus: ApplicationPaymentStatus;
  stripeCheckoutSessionId?: string | null;
  stripePaymentIntentId?: string | null;
  stripeInvoiceId?: string | null;
  stripeCustomerId?: string | null;
  paidAt?: Date | null;
};

export async function updateApplicationPaymentStatus(
  db: any,
  params: UpdateApplicationPaymentStatusParams,
) {
  const {
    flowType,
    applicationId,
    status,
    paymentStatus,
    stripeCheckoutSessionId,
    stripePaymentIntentId,
    stripeInvoiceId,
    stripeCustomerId,
    paidAt,
  } = params;

  const nextStatus = status;
  const resolvedPaidAt = paymentStatus === "paid" ? (paidAt || new Date()) : null;
  const now = new Date();

  if (flowType === "member_application") {
    const [updated] = await db
      .update(memberApplications)
      .set({
        ...(nextStatus ? { status: nextStatus } : {}),
        paymentStatus,
        ...(stripeCheckoutSessionId ? { stripeCheckoutSessionId } : {}),
        ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}),
        ...(stripeInvoiceId ? { stripeInvoiceId } : {}),
        ...(stripeCustomerId ? { stripeCustomerId } : {}),
        ...(nextStatus === "approved" ? { approvedAt: now } : {}),
        ...(nextStatus === "rejected" ? { rejectedAt: now } : {}),
        ...(resolvedPaidAt ? { paidAt: resolvedPaidAt } : {}),
        updatedAt: now,
      })
      .where(eq(memberApplications.id, applicationId))
      .returning();

    if (!updated) {
      return null;
    }

    if (updated.legacyOrderId) {
      await db
        .update(orders)
        .set({
          status: toLegacyOrderStatus(updated.status as ApplicationStatus, updated.paymentStatus as ApplicationPaymentStatus),
          ...(stripeCheckoutSessionId ? { stripeSessionId: stripeCheckoutSessionId } : {}),
        })
        .where(eq(orders.id, updated.legacyOrderId));
    }

    return { flowType, application: updated };
  }

  const [updated] = await db
    .update(partnerApplications)
    .set({
      ...(nextStatus ? { status: nextStatus } : {}),
      paymentStatus,
      ...(stripeCheckoutSessionId ? { stripeCheckoutSessionId } : {}),
      ...(stripePaymentIntentId ? { stripePaymentIntentId } : {}),
      ...(stripeInvoiceId ? { stripeInvoiceId } : {}),
      ...(stripeCustomerId ? { stripeCustomerId } : {}),
      ...(nextStatus === "approved" ? { approvedAt: now } : {}),
      ...(nextStatus === "rejected" ? { rejectedAt: now } : {}),
      ...(resolvedPaidAt ? { paidAt: resolvedPaidAt } : {}),
      updatedAt: now,
    })
    .where(eq(partnerApplications.id, applicationId))
    .returning();

  return updated ? { flowType, application: updated } : null;
}

type CreateDashboardUserFromApplicationParams = {
  db: any;
  flowType: ApplicationFlowType;
  application: MemberApplication | PartnerApplication;
  clerkUserId?: string | null;
  stripeCustomerId?: string | null;
  paymentDate?: Date | null;
};

export async function createDashboardUserFromApplication(params: CreateDashboardUserFromApplicationParams) {
  const {
    db,
    flowType,
    application,
    clerkUserId,
    stripeCustomerId,
    paymentDate,
  } = params;

  const email = normalizeEmail(application.email);
  if (!email) {
    throw new Error("Application email is missing while creating dashboard user");
  }

  const userType = flowType === "partner_application" ? "partner" : "member";
  const fullName = flowType === "partner_application"
    ? (application as PartnerApplication).name || ""
    : (application as MemberApplication).fullName || "";
  const firstNameFromApplication =
    flowType === "partner_application"
      ? fullName.split(/\s+/)[0] || null
      : (application as MemberApplication).firstName || null;
  const lastNameFromApplication =
    flowType === "partner_application"
      ? (() => {
          const parts = fullName.trim().split(/\s+/);
          return parts.length > 1 ? parts.slice(1).join(" ") : null;
        })()
      : (application as MemberApplication).lastName || null;
  const phone = application.phone || null;

  let existing: any | null = null;

  if (clerkUserId) {
    const [byClerk] = await db.select().from(users).where(eq(users.clerkId, clerkUserId)).limit(1);
    if (byClerk) {
      existing = byClerk;
    }
  }

  if (!existing) {
    const [byEmail] = await db
      .select()
      .from(users)
      .where(eq(users.emailNormalized, email))
      .orderBy(desc(users.updatedAt))
      .limit(1);

    if (byEmail) {
      existing = byEmail;
    }
  }

  const activatedAt = paymentDate || new Date();
  const commonValues = {
    email,
    emailNormalized: email,
    fullName: fullName || null,
    firstName: firstNameFromApplication,
    lastName: lastNameFromApplication,
    userType,
    accountStatus: "active",
    ...(stripeCustomerId ? { stripeCustomerId } : {}),
    activatedAt,
    lastPaymentAt: activatedAt,
    rawData: {
      source: flowType,
      applicationId: application.id,
      phone,
    },
    updatedAt: new Date(),
  };

  if (flowType === "member_application") {
    const memberApplication = application as MemberApplication;

    if (existing) {
      const [updated] = await db
        .update(users)
        .set({
          ...commonValues,
          ...(clerkUserId ? { clerkId: clerkUserId } : {}),
          memberApplicationId: memberApplication.id,
          memberOrderId: memberApplication.legacyOrderId || existing.memberOrderId,
        })
        .where(eq(users.id, existing.id))
        .returning();

      return updated || existing;
    }

    const [created] = await db
      .insert(users)
      .values({
        ...(clerkUserId ? { clerkId: clerkUserId } : {}),
        ...commonValues,
        memberApplicationId: memberApplication.id,
        memberOrderId: memberApplication.legacyOrderId,
      })
      .returning();

    return created;
  }

  const partnerApplication = application as PartnerApplication;

  if (existing) {
    const [updated] = await db
      .update(users)
      .set({
        ...commonValues,
        ...(clerkUserId ? { clerkId: clerkUserId } : {}),
        partnerApplicationId: partnerApplication.id,
        partnerOrderId: partnerApplication.partnerOrderId || existing.partnerOrderId,
      })
      .where(eq(users.id, existing.id))
      .returning();

    return updated || existing;
  }

  const [created] = await db
    .insert(users)
    .values({
      ...(clerkUserId ? { clerkId: clerkUserId } : {}),
      ...commonValues,
      partnerApplicationId: partnerApplication.id,
      partnerOrderId: partnerApplication.partnerOrderId,
    })
    .returning();

  return created;
}

export function looksLikePartnerOrder(order: {
  accountType?: string | null;
  membershipCategory?: string | null;
  applicantType?: string | null;
  applicationPayload?: unknown;
}) {
  const payload =
    order.applicationPayload && typeof order.applicationPayload === "object" && !Array.isArray(order.applicationPayload)
      ? (order.applicationPayload as Record<string, unknown>)
      : null;

  const signals = [
    order.accountType,
    order.membershipCategory,
    order.applicantType,
    payload?.type,
    payload?.accountType,
    payload?.applicationType,
    payload?.partnerApplicationId ? "partner" : null,
  ];

  return signals.some((value) => typeof value === "string" && value.trim().toLowerCase().includes("partner"));
}

export function resolveStripeFlowType(metadata: Record<string, string | undefined>) {
  const raw =
    metadata.flowType ||
    metadata.orderKind ||
    metadata.type ||
    "";
  const normalized = raw.trim().toLowerCase();

  if (normalized === "partner_application") {
    return "partner_application" as const;
  }

  if (normalized === "member_application" || normalized === "membership") {
    return "member_application" as const;
  }

  return null;
}

export function getMetadataApplicationId(metadata: Record<string, string | undefined>) {
  return (
    metadata.applicationId ||
    metadata.memberApplicationId ||
    metadata.partnerApplicationId ||
    metadata.partner_application_id ||
    null
  );
}

export function getMetadataOrderId(metadata: Record<string, string | undefined>) {
  return metadata.orderId || null;
}
