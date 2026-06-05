import type { SourceCertificateRecord, SourceOrderRecord } from "@/features/shared/server/source-records";
import { upsertCanonicalMembership } from "./membership.repository";

export async function importSourceOrderMembership(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  order: SourceOrderRecord;
  userId: string;
  certificate?: SourceCertificateRecord | null;
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
