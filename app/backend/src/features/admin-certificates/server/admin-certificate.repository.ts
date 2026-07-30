import { and, desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreAdminCertificates } from "@/lib/schema";

type DbClient = ReturnType<typeof requireDb>;

export type AdminCertificateRow = typeof coreAdminCertificates.$inferSelect;

export async function listAdminCertificatesByOrderId(db: DbClient, orderId: string) {
  return db
    .select()
    .from(coreAdminCertificates)
    .where(eq(coreAdminCertificates.orderId, orderId))
    .orderBy(desc(coreAdminCertificates.createdAt));
}

export async function getAdminCertificateById(
  db: DbClient,
  input: { id: string; orderId: string },
) {
  const [row] = await db
    .select()
    .from(coreAdminCertificates)
    .where(
      and(
        eq(coreAdminCertificates.id, input.id),
        eq(coreAdminCertificates.orderId, input.orderId),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function createAdminCertificate(
  db: DbClient,
  input: {
    orderId: string;
    clerkUserId: string | null;
    title: string;
    fileUrl: string;
    fileKey: string | null;
    fileName: string | null;
    fileType: string | null;
    issuedAt: Date | null;
  },
) {
  const [created] = await db
    .insert(coreAdminCertificates)
    .values({
      orderId: input.orderId,
      clerkUserId: input.clerkUserId,
      title: input.title,
      fileUrl: input.fileUrl,
      fileKey: input.fileKey,
      fileName: input.fileName,
      fileType: input.fileType,
      issuedAt: input.issuedAt,
    })
    .returning();

  return created ?? null;
}

export async function updateAdminCertificate(
  db: DbClient,
  input: {
    id: string;
    orderId: string;
    values: Partial<{
      title: string;
      fileUrl: string;
      fileKey: string | null;
      fileName: string | null;
      fileType: string | null;
      issuedAt: Date | null;
    }>;
  },
) {
  const [updated] = await db
    .update(coreAdminCertificates)
    .set({ ...input.values, updatedAt: new Date() })
    .where(
      and(
        eq(coreAdminCertificates.id, input.id),
        eq(coreAdminCertificates.orderId, input.orderId),
      ),
    )
    .returning();

  return updated ?? null;
}

export async function deleteAdminCertificateById(
  db: DbClient,
  input: { id: string; orderId: string },
) {
  const [deleted] = await db
    .delete(coreAdminCertificates)
    .where(
      and(
        eq(coreAdminCertificates.id, input.id),
        eq(coreAdminCertificates.orderId, input.orderId),
      ),
    )
    .returning();

  return deleted ?? null;
}
