import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreApplications } from "@/lib/schema";
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
