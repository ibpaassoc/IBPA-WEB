import crypto from "crypto";
import { eq } from "drizzle-orm";

import { requireDb } from "@/lib/db";
import {
  coreAdminCertificates,
  coreApplications,
  coreCertificates,
  coreMemberships,
  corePayments,
} from "@/lib/schema";
import { stripe } from "@/services/stripe";
import { upsertCanonicalPayment } from "@/features/payments/server/payment.repository";
import { upsertCanonicalMembership } from "./membership.repository";
import { upsertCanonicalTeam } from "@/features/teams/server/team.repository";
import { INCLUDED_TEAM_SEATS, isBusinessOwnerMembershipType } from "@/features/teams/server/team-access";
import { getMembershipChangeDetails } from "./membership-change";

type DbClient = ReturnType<typeof requireDb>;
type ApplicationRecord = typeof coreApplications.$inferSelect;

const MEMBERSHIP_PRICE_KEYS = {
  Specialist: "STRIPE_PRICE_SPECIALIST",
  Professional: "STRIPE_PRICE_PROFESSIONAL",
  Trainer: "STRIPE_PRICE_TRAINER",
  Business: "STRIPE_PRICE_BUSINESS",
  Brand: "STRIPE_PRICE_BRAND",
} as const;

function asRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function getMembershipPriceId(category: keyof typeof MEMBERSHIP_PRICE_KEYS) {
  const key = MEMBERSHIP_PRICE_KEYS[category];
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not configured`);
  return value;
}

function generateCertificateNumber() {
  return `CERT-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

async function updateExistingStripeSubscription(
  previousPayment: typeof corePayments.$inferSelect | null,
  targetCategory: keyof typeof MEMBERSHIP_PRICE_KEYS,
  targetApplicationId: string,
) {
  const previousSessionId = previousPayment?.stripeSessionId;
  if (!previousSessionId?.startsWith("cs_")) return null;

  const checkoutSession = await stripe.checkout.sessions.retrieve(previousSessionId);
  const subscriptionId = typeof checkoutSession.subscription === "string"
    ? checkoutSession.subscription
    : checkoutSession.subscription?.id;
  if (!subscriptionId) return null;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const subscriptionItem = subscription.items.data[0];
  if (!subscriptionItem) {
    throw new Error("The existing membership subscription has no billable item.");
  }

  await stripe.subscriptions.update(subscriptionId, {
    items: [{ id: subscriptionItem.id, price: getMembershipPriceId(targetCategory) }],
    proration_behavior: "none",
    metadata: {
      ...subscription.metadata,
      applicationId: targetApplicationId,
      orderId: targetApplicationId,
      orderKind: "membership",
      membershipCategory: targetCategory,
    },
  });

  return subscriptionId;
}

export async function activateMembershipChange(
  db: DbClient,
  params: {
    application: ApplicationRecord;
    stripeSessionId?: string | null;
    paidAt?: Date;
  },
) {
  const applicationData = asRecord(params.application.applicationData);
  const change = getMembershipChangeDetails(applicationData.membershipChange);
  if (!change || applicationData.applicationKind !== "MEMBERSHIP_CHANGE") {
    throw new Error("This application is not a valid membership change.");
  }
  if (!params.application.userId) {
    throw new Error("The membership change is not linked to a member.");
  }

  if (params.application.status === "PAID") {
    const [activeMembership, activeCertificate] = await Promise.all([
      db.select().from(coreMemberships).where(eq(coreMemberships.id, params.application.id)).limit(1)
        .then((rows: typeof coreMemberships.$inferSelect[]) => rows[0] ?? null),
      db.select().from(coreCertificates).where(eq(coreCertificates.membershipId, params.application.id)).limit(1)
        .then((rows: typeof coreCertificates.$inferSelect[]) => rows[0] ?? null),
    ]);
    return {
      balanceDue: change.balanceDue,
      certificateNumber: activeCertificate?.certificateNumber || "",
      expiresAt: activeMembership?.expiresAt ?? null,
      fromCategory: change.fromCategory,
      subscriptionId: null,
      toCategory: change.toCategory,
    };
  }

  const [previousMembership, previousPayment, previousCertificate] = await Promise.all([
    db.select().from(coreMemberships).where(eq(coreMemberships.id, change.previousMembershipId)).limit(1)
      .then((rows: typeof coreMemberships.$inferSelect[]) => rows[0] ?? null),
    db.select().from(corePayments).where(eq(corePayments.id, change.previousMembershipId)).limit(1)
      .then((rows: typeof corePayments.$inferSelect[]) => rows[0] ?? null),
    db.select().from(coreCertificates).where(eq(coreCertificates.membershipId, change.previousMembershipId)).limit(1)
      .then((rows: typeof coreCertificates.$inferSelect[]) => rows[0] ?? null),
  ]);

  if (!previousMembership || previousMembership.userId !== params.application.userId) {
    throw new Error("The previous membership could not be verified.");
  }
  if (previousMembership.type !== change.fromCategory && previousMembership.status === "ACTIVE") {
    throw new Error("The member's active membership has changed since this request was submitted.");
  }

  const subscriptionId = await updateExistingStripeSubscription(
    previousPayment,
    change.toCategory,
    params.application.id,
  );
  const paidAt = params.paidAt ?? new Date();
  const certificateNumber = previousCertificate?.certificateNumber || generateCertificateNumber();

  await db
    .update(coreMemberships)
    .set({ status: "CANCELLED" })
    .where(eq(coreMemberships.id, previousMembership.id));

  await upsertCanonicalMembership(db, {
    id: params.application.id,
    userId: params.application.userId,
    type: change.toCategory,
    status: "ACTIVE",
    startedAt: paidAt,
    expiresAt: previousMembership.expiresAt,
  });

  if (previousCertificate) {
    await db
      .update(coreCertificates)
      .set({
        membershipId: params.application.id,
        expiresAt: previousMembership.expiresAt,
      })
      .where(eq(coreCertificates.id, previousCertificate.id));
  } else {
    await db.insert(coreCertificates).values({
      id: crypto.randomUUID(),
      membershipId: params.application.id,
      certificateNumber,
      issuedAt: paidAt,
      expiresAt: previousMembership.expiresAt,
    });
  }

  await db
    .update(coreAdminCertificates)
    .set({ orderId: params.application.id, updatedAt: paidAt })
    .where(eq(coreAdminCertificates.orderId, previousMembership.id));

  await upsertCanonicalPayment(db, {
    id: params.application.id,
    userId: params.application.userId,
    type: "membership_change",
    stripeSessionId: params.stripeSessionId ?? null,
    amount: change.balanceDue,
    status: "PAID",
    createdAt: params.application.createdAt,
    paidAt,
  });

  await db
    .update(coreApplications)
    .set({
      status: "PAID",
      approvedAt: params.application.approvedAt ?? paidAt,
      applicationData: {
        ...applicationData,
        certificateNumber,
        membershipChange: {
          ...change,
          activatedAt: paidAt.toISOString(),
          stripeSubscriptionId: subscriptionId,
        },
      },
    })
    .where(eq(coreApplications.id, params.application.id));

  if (isBusinessOwnerMembershipType(change.toCategory)) {
    await upsertCanonicalTeam(db, {
      id: params.application.id,
      ownerUserId: params.application.userId,
      name: params.application.fullName,
      seatCount: INCLUDED_TEAM_SEATS,
      createdAt: paidAt,
    });
  }

  return {
    balanceDue: change.balanceDue,
    certificateNumber,
    expiresAt: previousMembership.expiresAt,
    fromCategory: change.fromCategory,
    subscriptionId,
    toCategory: change.toCategory,
  };
}
