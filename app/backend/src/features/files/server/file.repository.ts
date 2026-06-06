import { and, desc, eq, sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreFiles } from "@/lib/schema";

type DbClient = ReturnType<typeof requireDb>;

const externalCertificateTypeCondition = sql`(${coreFiles.type})::text in ('certificate', 'external_certificate')`;

export async function listExternalCertificateFilesByUserId(
  db: DbClient,
  userId: string,
) {
  return db
    .select()
    .from(coreFiles)
    .where(
      and(
        eq(coreFiles.ownerUserId, userId),
        externalCertificateTypeCondition,
      ),
    )
    .orderBy(desc(coreFiles.createdAt));
}

export async function createExternalCertificateFile(
  db: DbClient,
  input: {
    id: string;
    ownerUserId: string;
    title: string;
    fileUrl: string;
  },
) {
  const [created] = await db
    .insert(coreFiles)
    .values({
      id: input.id,
      ownerUserId: input.ownerUserId,
      relatedId: input.ownerUserId,
      type: "certificate",
      fileUrl: input.fileUrl,
      fileName: input.title,
    })
    .returning();

  return created ?? null;
}

export async function deleteExternalCertificateFileById(
  db: DbClient,
  input: {
    fileId: string;
    ownerUserId: string;
  },
) {
  const [deleted] = await db
    .delete(coreFiles)
    .where(
      and(
        eq(coreFiles.id, input.fileId),
        eq(coreFiles.ownerUserId, input.ownerUserId),
        externalCertificateTypeCondition,
      ),
    )
    .returning();

  return deleted ?? null;
}
