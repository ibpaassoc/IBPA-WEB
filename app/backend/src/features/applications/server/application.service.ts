import type { Order, PartnerApplication } from "@/lib/schema";
import { upsertCanonicalApplication } from "./application.repository";
import type { CanonicalApplicationInput } from "./application.types";

function mapLegacyStatus(status: string | null | undefined): CanonicalApplicationInput["status"] {
  switch ((status || "").toLowerCase()) {
    case "review":
      return "UNDER_REVIEW";
    case "approved":
      return "APPROVED";
    case "rejected":
      return "REJECTED";
    case "paid":
      return "PAID";
    default:
      return "SUBMITTED";
  }
}

export function buildApplicationFromLegacyOrder(params: {
  order: Order;
  userId?: string | null;
  applicationFiles?: Array<Record<string, unknown>>;
}) {
  const type = (params.order.accountType || "").toLowerCase() === "partner" ? "PARTNER" : "MEMBER";

  return {
    id: params.order.id,
    userId: params.userId ?? null,
    type,
    packageName: params.order.package ?? params.order.membershipCategory ?? null,
    status: mapLegacyStatus(params.order.status),
    fullName: params.order.name,
    email: params.order.email,
    phone: params.order.phone ?? null,
    paymentLink: params.order.secureToken ? `/payment-link/${params.order.secureToken}` : null,
    applicationData:
      params.order.applicationPayload && typeof params.order.applicationPayload === "object" && !Array.isArray(params.order.applicationPayload)
        ? params.order.applicationPayload as Record<string, unknown>
        : {},
    applicationFiles: params.applicationFiles ?? [],
    approvedAt: params.order.status === "approved" || params.order.status === "paid" ? params.order.createdAt : null,
    createdAt: params.order.createdAt,
  } satisfies CanonicalApplicationInput;
}

export function buildApplicationFromPartnerApplication(params: {
  application: PartnerApplication;
  userId?: string | null;
}) {
  return {
    id: params.application.id,
    userId: params.userId ?? null,
    type: "PARTNER",
    packageName: params.application.requestedTier ?? null,
    status:
      params.application.paymentStatus === "PAID"
        ? "PAID"
        : params.application.status === "APPROVED"
          ? "APPROVED"
          : params.application.status === "REJECTED"
            ? "REJECTED"
            : "SUBMITTED",
    fullName: params.application.name,
    email: params.application.email,
    phone: params.application.phone ?? null,
    paymentLink: params.application.stripeCheckoutSessionId ?? null,
    applicationData: {
      message: params.application.message,
      requestedTier: params.application.requestedTier,
      partnerOrderId: params.application.partnerOrderId,
      stripeInvoiceId: params.application.stripeInvoiceId,
      stripePaymentIntentId: params.application.stripePaymentIntentId,
    },
    applicationFiles: [],
    approvedAt: params.application.approvedAt ?? null,
    createdAt: params.application.createdAt,
  } satisfies CanonicalApplicationInput;
}

export async function syncLegacyOrderApplication(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  order: Order;
  userId?: string | null;
  applicationFiles?: Array<Record<string, unknown>>;
}) {
  return upsertCanonicalApplication(db, buildApplicationFromLegacyOrder(params));
}

export async function syncLegacyPartnerApplication(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  application: PartnerApplication;
  userId?: string | null;
}) {
  return upsertCanonicalApplication(db, buildApplicationFromPartnerApplication(params));
}
