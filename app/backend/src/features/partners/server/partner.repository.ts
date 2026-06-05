import { desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { corePartners } from "@/lib/schema";

type DbClient = ReturnType<typeof requireDb>;

export type PartnerPersistenceInput = {
  id: string;
  title: string;
  body: string;
  coverImage?: string | null;
  ctaUrl?: string | null;
  ctaLabel?: string | null;
  isPinned?: boolean;
  publishToSite?: boolean;
  publishToDashboard?: boolean;
};

export async function listCanonicalPartners(db: DbClient) {
  return db.select().from(corePartners).orderBy(desc(corePartners.isPinned), desc(corePartners.createdAt));
}

export async function clearCanonicalPinnedPartners(db: DbClient, excludeId?: string) {
  const existing = await db.select().from(corePartners);
  const pinnedIds = existing
    .filter((item: typeof corePartners.$inferSelect) => item.isPinned && item.id !== excludeId)
    .map((item: typeof corePartners.$inferSelect) => item.id);

  for (const id of pinnedIds) {
    await db.update(corePartners).set({ isPinned: false, updatedAt: new Date() }).where(eq(corePartners.id, id));
  }
}

export async function upsertCanonicalPartner(db: DbClient, input: PartnerPersistenceInput) {
  const [existing] = await db.select().from(corePartners).where(eq(corePartners.id, input.id)).limit(1);

  if (existing) {
    const [updated] = await db
      .update(corePartners)
      .set({
        title: input.title,
        body: input.body,
        coverImage: input.coverImage ?? existing.coverImage,
        ctaUrl: input.ctaUrl ?? existing.ctaUrl,
        ctaLabel: input.ctaLabel ?? existing.ctaLabel,
        isPinned: Boolean(input.isPinned),
        publishToSite: Boolean(input.publishToSite),
        publishToDashboard: Boolean(input.publishToDashboard),
        updatedAt: new Date(),
      })
      .where(eq(corePartners.id, input.id))
      .returning();

    return { record: updated ?? existing, created: false };
  }

  const [created] = await db
    .insert(corePartners)
    .values({
      id: input.id,
      title: input.title,
      body: input.body,
      coverImage: input.coverImage ?? null,
      ctaUrl: input.ctaUrl ?? null,
      ctaLabel: input.ctaLabel ?? null,
      isPinned: Boolean(input.isPinned),
      publishToSite: Boolean(input.publishToSite),
      publishToDashboard: Boolean(input.publishToDashboard),
    })
    .returning();

  return { record: created, created: true };
}

export async function deleteCanonicalPartner(db: DbClient, id: string) {
  const [deleted] = await db.delete(corePartners).where(eq(corePartners.id, id)).returning();
  return deleted ?? null;
}
