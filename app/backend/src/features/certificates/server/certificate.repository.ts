import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreCertificates } from "@/lib/schema";

type DbClient = ReturnType<typeof requireDb>;

export async function upsertCanonicalCertificate(db: DbClient, input: {
  id: string;
  membershipId: string;
  certificateNumber: string;
  certificateUrl?: string | null;
  issuedAt?: Date;
  expiresAt?: Date | null;
}) {
  const [existing] = await db.select().from(coreCertificates).where(eq(coreCertificates.id, input.id)).limit(1);

  if (existing) {
    const [updated] = await db
      .update(coreCertificates)
      .set({
        membershipId: input.membershipId,
        certificateNumber: input.certificateNumber,
        certificateUrl: input.certificateUrl ?? existing.certificateUrl,
        issuedAt: input.issuedAt ?? existing.issuedAt,
        expiresAt: input.expiresAt ?? existing.expiresAt,
      })
      .where(eq(coreCertificates.id, existing.id))
      .returning();

    return { record: updated ?? existing, created: false };
  }

  const [created] = await db
    .insert(coreCertificates)
    .values({
      id: input.id,
      membershipId: input.membershipId,
      certificateNumber: input.certificateNumber,
      certificateUrl: input.certificateUrl ?? null,
      issuedAt: input.issuedAt ?? new Date(),
      expiresAt: input.expiresAt ?? null,
    })
    .returning();

  return { record: created, created: true };
}
