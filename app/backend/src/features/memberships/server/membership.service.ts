import type { Certificate, Order } from "@/lib/schema";
import { upsertCanonicalMembership } from "./membership.repository";

export async function syncLegacyOrderMembership(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  order: Order;
  userId: string;
  certificate?: Certificate | null;
}) {
  if (params.order.status !== "paid") {
    return null;
  }

  return upsertCanonicalMembership(db, {
    id: params.order.id,
    userId: params.userId,
    type: params.order.membershipCategory || params.order.package || "Professional",
    status:
      params.certificate?.expiresAt && params.certificate.expiresAt.getTime() < Date.now()
        ? "EXPIRED"
        : "ACTIVE",
    startedAt: params.order.createdAt,
    expiresAt: params.certificate?.expiresAt ?? null,
  });
}
