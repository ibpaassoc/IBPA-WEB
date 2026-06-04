import type { Certificate } from "@/lib/schema";
import { upsertCanonicalCertificate } from "./certificate.repository";

export async function syncLegacyCertificate(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  certificate: Certificate;
  membershipId: string;
}) {
  return upsertCanonicalCertificate(db, {
    id: params.certificate.id,
    membershipId: params.membershipId,
    certificateNumber: params.certificate.certNumber,
    certificateUrl: params.certificate.certificateUrl ?? null,
    issuedAt: params.certificate.createdAt,
    expiresAt: params.certificate.expiresAt ?? null,
  });
}
