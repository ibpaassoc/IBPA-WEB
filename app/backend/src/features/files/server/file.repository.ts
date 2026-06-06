import { and, desc, eq, inArray } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreFiles } from "@/lib/schema";

type DbClient = ReturnType<typeof requireDb>;

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
        inArray(coreFiles.type, ["certificate", "external_certificate"]),
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
        inArray(coreFiles.type, ["certificate", "external_certificate"]),
      ),
    )
    .returning();

  return deleted ?? null;
}
