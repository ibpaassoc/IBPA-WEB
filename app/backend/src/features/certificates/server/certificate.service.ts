import type { SourceCertificateRecord } from "@/features/shared/server/source-records";
import { upsertCanonicalCertificate } from "./certificate.repository";

export async function importSourceCertificate(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  certificate: SourceCertificateRecord;
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
