import type { SourceOrderRecord, SourcePartnerApplicationRecord } from "@/features/shared/server/source-records";
import { upsertCanonicalPayment, upsertCanonicalStripeWebhookEvent } from "./payment.repository";

const LEGACY_MEMBERSHIP_AMOUNTS: Record<string, number> = {
  Specialist: 4900,
  Professional: 12900,
  Trainer: 24900,
  Business: 39900,
  Brand: 99900,
  Associate: 49900,
  Community: 99900,
  Premier: 199900,
  partner: 49900,
};

function resolveLegacyAmount(category: string | null | undefined) {
  return LEGACY_MEMBERSHIP_AMOUNTS[category || ""] ?? 0;
}

export async function importSourceOrderPayment(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  order: SourceOrderRecord;
  userId?: string | null;
}) {
  return upsertCanonicalPayment(db, {
    id: params.order.id,
    userId: params.userId ?? null,
    type: (params.order.accountType || "").toLowerCase() === "partner" ? "membership_partner" : "membership",
    stripeSessionId: params.order.stripeSessionId ?? null,
    amount: resolveLegacyAmount(params.order.membershipCategory ?? params.order.package),
    status: params.order.status === "paid" ? "PAID" : params.order.stripeSessionId ? "PENDING" : "FAILED",
    createdAt: params.order.createdAt,
    paidAt: params.order.status === "paid" ? params.order.createdAt : null,
  });
}

export async function importSourcePartnerApplicationPayment(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  application: SourcePartnerApplicationRecord;
  userId?: string | null;
}) {
  return upsertCanonicalPayment(db, {
    id: params.application.id,
    userId: params.userId ?? null,
    type: "membership_partner",
    stripeSessionId: params.application.stripeCheckoutSessionId ?? null,
    amount: resolveLegacyAmount(params.application.requestedTier),
    status:
      params.application.paymentStatus === "PAID"
        ? "PAID"
        : params.application.paymentStatus === "FAILED"
          ? "FAILED"
          : "PENDING",
    createdAt: params.application.createdAt,
    paidAt: params.application.paidAt ?? null,
  });
}

export async function importSourceStripeWebhookEvent(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  id: string;
  stripeEventId: string;
  eventType: string;
  payload?: Record<string, unknown>;
  processedAt?: Date | null;
}) {
  return upsertCanonicalStripeWebhookEvent(db, {
    id: params.id,
    stripeEventId: params.stripeEventId,
    eventType: params.eventType,
    payload: params.payload ?? {},
    processedAt: params.processedAt ?? null,
  });
}
