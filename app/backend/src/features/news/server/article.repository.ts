import { and, desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { contentItems, coreArticles } from "@/lib/schema";

type DbClient = ReturnType<typeof requireDb>;

export type ArticlePersistenceInput = {
  id: string;
  title: string;
  content: string;
  coverImage?: string | null;
  ctaUrl?: string | null;
  ctaLabel?: string | null;
  isPinned?: boolean;
  publishToSite?: boolean;
  publishToDashboard?: boolean;
};

export async function listCanonicalArticles(db: DbClient) {
  return db.select().from(coreArticles).orderBy(desc(coreArticles.isPinned), desc(coreArticles.createdAt));
}

export async function listLegacyArticles(db: DbClient) {
  return db
    .select()
    .from(contentItems)
    .where(eq(contentItems.type, "news"))
    .orderBy(desc(contentItems.isPinned), desc(contentItems.createdAt));
}

export async function clearLegacyPinnedArticles(db: DbClient, excludeId?: string) {
  const existing = await db.select().from(contentItems).where(eq(contentItems.type, "news"));
  const pinnedIds = existing.filter((item: typeof contentItems.$inferSelect) => item.isPinned && item.id !== excludeId).map((item: typeof contentItems.$inferSelect) => item.id);

  for (const id of pinnedIds) {
    await db.update(contentItems).set({ isPinned: false, updatedAt: new Date() }).where(eq(contentItems.id, id));
  }
}

export async function clearCanonicalPinnedArticles(db: DbClient, excludeId?: string) {
  const existing = await db.select().from(coreArticles);
  const pinnedIds = existing.filter((item: typeof coreArticles.$inferSelect) => item.isPinned && item.id !== excludeId).map((item: typeof coreArticles.$inferSelect) => item.id);

  for (const id of pinnedIds) {
    await db.update(coreArticles).set({ isPinned: false, updatedAt: new Date() }).where(eq(coreArticles.id, id));
  }
}

export async function upsertCanonicalArticle(db: DbClient, input: ArticlePersistenceInput) {
  const [existing] = await db.select().from(coreArticles).where(eq(coreArticles.id, input.id)).limit(1);

  if (existing) {
    const [updated] = await db
      .update(coreArticles)
      .set({
        title: input.title,
        content: input.content,
        coverImage: input.coverImage ?? existing.coverImage,
        ctaUrl: input.ctaUrl ?? existing.ctaUrl,
        ctaLabel: input.ctaLabel ?? existing.ctaLabel,
        isPinned: Boolean(input.isPinned),
        publishToSite: Boolean(input.publishToSite),
        publishToDashboard: Boolean(input.publishToDashboard),
        updatedAt: new Date(),
      })
      .where(eq(coreArticles.id, input.id))
      .returning();

    return { record: updated ?? existing, created: false };
  }

  const [created] = await db
    .insert(coreArticles)
    .values({
      id: input.id,
      title: input.title,
      content: input.content,
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

export async function upsertLegacyArticle(db: DbClient, input: ArticlePersistenceInput) {
  const [existing] = await db.select().from(contentItems).where(and(eq(contentItems.id, input.id), eq(contentItems.type, "news"))).limit(1);

  if (existing) {
    const [updated] = await db
      .update(contentItems)
      .set({
        type: "news",
        title: input.title,
        body: input.content,
        coverImage: input.coverImage ?? null,
        ctaUrl: input.ctaUrl ?? null,
        ctaLabel: input.ctaLabel ?? null,
        isPinned: Boolean(input.isPinned),
        publishToSite: Boolean(input.publishToSite),
        publishToDashboard: Boolean(input.publishToDashboard),
        updatedAt: new Date(),
      })
      .where(eq(contentItems.id, input.id))
      .returning();

    return updated ?? existing;
  }

  const [created] = await db
    .insert(contentItems)
    .values({
      id: input.id,
      type: "news",
      title: input.title,
      body: input.content,
      coverImage: input.coverImage ?? null,
      ctaUrl: input.ctaUrl ?? null,
      ctaLabel: input.ctaLabel ?? null,
      isPinned: Boolean(input.isPinned),
      publishToSite: Boolean(input.publishToSite),
      publishToDashboard: Boolean(input.publishToDashboard),
    })
    .returning();

  return created;
}

export async function deleteCanonicalArticle(db: DbClient, id: string) {
  const [deleted] = await db.delete(coreArticles).where(eq(coreArticles.id, id)).returning();
  return deleted ?? null;
}

export async function deleteLegacyArticle(db: DbClient, id: string) {
  const [deleted] = await db.delete(contentItems).where(and(eq(contentItems.id, id), eq(contentItems.type, "news"))).returning();
  return deleted ?? null;
}
