import { and, eq, inArray } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreApplications, coreCertificates, coreFiles, coreMemberships, corePayments } from "@/lib/schema";
import type { CanonicalApplicationInput } from "./application.types";

type DbClient = ReturnType<typeof requireDb>;

export async function upsertCanonicalApplication(db: DbClient, input: CanonicalApplicationInput) {
  const [existing] = await db.select().from(coreApplications).where(eq(coreApplications.id, input.id)).limit(1);

  if (existing) {
    const [updated] = await db
      .update(coreApplications)
      .set({
        userId: input.userId ?? existing.userId,
        type: input.type,
        packageName: input.packageName ?? existing.packageName,
        status: input.status,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone ?? existing.phone,
        paymentLink: input.paymentLink ?? existing.paymentLink,
        applicationData: input.applicationData,
        applicationFiles: input.applicationFiles,
        approvedAt: input.approvedAt ?? existing.approvedAt,
        createdAt: input.createdAt ?? existing.createdAt,
      })
      .where(eq(coreApplications.id, existing.id))
      .returning();

    return { record: updated ?? existing, created: false };
  }

  const [created] = await db
    .insert(coreApplications)
    .values({
      id: input.id,
      userId: input.userId ?? null,
      type: input.type,
      packageName: input.packageName ?? null,
      status: input.status,
      fullName: input.fullName,
      email: input.email,
      phone: input.phone ?? null,
      paymentLink: input.paymentLink ?? null,
      applicationData: input.applicationData,
      applicationFiles: input.applicationFiles,
      approvedAt: input.approvedAt ?? null,
      createdAt: input.createdAt ?? new Date(),
    })
    .returning();

  return { record: created, created: true };
}

export async function findCanonicalApplicationById(db: DbClient, id: string) {
  const [record] = await db.select().from(coreApplications).where(eq(coreApplications.id, id)).limit(1);
  return record ?? null;
}

export async function findCanonicalApplicationByPaymentToken(db: DbClient, token: string) {
  const [record] = await db
    .select()
    .from(coreApplications)
    .where(eq(coreApplications.paymentLink, `/payment-link/${token}`))
    .limit(1);

  return record ?? null;
}

export async function updateCanonicalApplicationStatus(db: DbClient, params: {
  id: string;
  status: CanonicalApplicationInput["status"];
  paymentLink?: string | null;
  approvedAt?: Date | null;
}) {
  const [updated] = await db
    .update(coreApplications)
    .set({
      status: params.status,
      ...(params.paymentLink !== undefined ? { paymentLink: params.paymentLink } : {}),
      ...(params.approvedAt !== undefined ? { approvedAt: params.approvedAt } : {}),
    })
    .where(eq(coreApplications.id, params.id))
    .returning();

  return updated ?? null;
}

export async function setCanonicalApplicationFiles(db: DbClient, params: {
  applicationId: string;
  files: Array<Record<string, unknown>>;
}) {
  const [updated] = await db
    .update(coreApplications)
    .set({
      applicationFiles: params.files,
    })
    .where(eq(coreApplications.id, params.applicationId))
    .returning();

  return updated ?? null;
}

export async function listCanonicalApplicationFileRecords(db: DbClient, applicationId: string) {
  return db
    .select()
    .from(coreFiles)
    .where(and(eq(coreFiles.relatedId, applicationId), eq(coreFiles.type, "APPLICATION")));
}

export async function upsertCanonicalApplicationFile(db: DbClient, input: {
  id: string;
  ownerUserId?: string | null;
  applicationId: string;
  fileUrl: string;
  fileName?: string | null;
}) {
  const [existing] = await db.select().from(coreFiles).where(eq(coreFiles.id, input.id)).limit(1);

  if (existing) {
    const [updated] = await db
      .update(coreFiles)
      .set({
        ownerUserId: input.ownerUserId ?? existing.ownerUserId,
        relatedId: input.applicationId,
        type: "APPLICATION",
        fileUrl: input.fileUrl,
        fileName: input.fileName ?? existing.fileName,
      })
      .where(eq(coreFiles.id, existing.id))
      .returning();

    return updated ?? existing;
  }

  const [created] = await db
    .insert(coreFiles)
    .values({
      id: input.id,
      ownerUserId: input.ownerUserId ?? null,
      relatedId: input.applicationId,
      type: "APPLICATION",
      fileUrl: input.fileUrl,
      fileName: input.fileName ?? null,
    })
    .returning();

  return created;
}

export async function deleteCanonicalApplicationFilesExcept(db: DbClient, params: {
  applicationId: string;
  keepIds: string[];
}) {
  const existing = await listCanonicalApplicationFileRecords(db, params.applicationId);
  const keep = new Set(params.keepIds);
  const idsToDelete = existing
    .filter((record: typeof coreFiles.$inferSelect) => !keep.has(record.id))
    .map((record: typeof coreFiles.$inferSelect) => record.id);

  if (idsToDelete.length > 0) {
    await db
      .delete(coreFiles)
      .where(inArray(coreFiles.id, idsToDelete));
  }
}

export async function deleteCanonicalApplicationAggregate(db: DbClient, applicationId: string) {
  await db.delete(coreFiles).where(and(eq(coreFiles.relatedId, applicationId), eq(coreFiles.type, "APPLICATION")));
  await db.delete(coreCertificates).where(eq(coreCertificates.membershipId, applicationId));
  await db.delete(coreMemberships).where(eq(coreMemberships.id, applicationId));
  await db.delete(corePayments).where(eq(corePayments.id, applicationId));
  await db.delete(coreApplications).where(eq(coreApplications.id, applicationId));
}
