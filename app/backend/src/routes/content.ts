import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { requireDb } from "../lib/db";
import { contentItems } from "../lib/schema";
import { adminClerkMiddleware, requireAdminAccess } from "../services/admin";
import { createOrUpdateEvent, listAdminEvents, listPublicEvents, removeEvent } from "../features/events/server/event.service";
import { createOrUpdateArticle, listAdminArticles, listPublicArticles, removeArticle } from "../features/news/server/article.service";

export const contentRouter = Router();

function getSingleValue(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : null;
  }

  return null;
}

function normalizeCoverAspect(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const coverAspect = Number(value);
  return Number.isFinite(coverAspect) && coverAspect > 0 ? coverAspect : null;
}

function serializeLegacyContentItem(item: typeof contentItems.$inferSelect) {
  const coverAspect = normalizeCoverAspect(item.coverAspect);
  return {
    ...item,
    coverAspect,
    cover_aspect: coverAspect,
  };
}

async function clearPinnedLegacyPartners(db: ReturnType<typeof requireDb>, excludeId?: string) {
  const existing = await db.select().from(contentItems).where(eq(contentItems.type, "partners"));
  const pinnedIds = existing.filter((item: typeof contentItems.$inferSelect) => item.isPinned && item.id !== excludeId).map((item: typeof contentItems.$inferSelect) => item.id);

  for (const id of pinnedIds) {
    await db.update(contentItems).set({ isPinned: false, updatedAt: new Date() }).where(eq(contentItems.id, id));
  }
}

contentRouter.get("/public", async (req, res) => {
  try {
    const db = requireDb();
    const type = getSingleValue(req.query.type);
    const target = getSingleValue(req.query.target) === "dashboard" ? "dashboard" : "site";

    if (type === "news") {
      const items = await listPublicArticles(db, target);
      return res.json({ items });
    }

    if (type === "events") {
      const items = await listPublicEvents(db, target);
      return res.json({ items });
    }

    if (type !== "partners") {
      return res.status(400).json({ error: "Query param 'type' must be 'news', 'events', or 'partners'." });
    }

    if (target === "dashboard") {
      return res.json({ items: [] });
    }

    const items = await db
      .select()
      .from(contentItems)
      .where(and(eq(contentItems.type, "partners"), eq(contentItems.publishToSite, true)))
      .orderBy(desc(contentItems.isPinned), desc(contentItems.createdAt));

    return res.json({ items: items.map(serializeLegacyContentItem) });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

    console.error("[Content /public] Error:", error);
    return res.status(500).json({ error: "Failed to fetch content" });
  }
});

contentRouter.get("/admin", adminClerkMiddleware, requireAdminAccess, async (_req, res) => {
  try {
    const db = requireDb();
    const [events, articles, partners] = await Promise.all([
      listAdminEvents(db),
      listAdminArticles(db),
      db.select().from(contentItems).where(eq(contentItems.type, "partners")).orderBy(desc(contentItems.isPinned), desc(contentItems.createdAt)),
    ]);

    const items = [...events, ...articles, ...partners.map(serializeLegacyContentItem)]
      .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ items });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

    console.error("[Content /admin GET] Error:", error);
    res.status(500).json({ error: "Failed to fetch content items" });
  }
});

contentRouter.post("/admin", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  try {
    const db = requireDb();
    const bodyPayload = (req.body || {}) as Record<string, any>;
    const { type, title, body } = bodyPayload;

    if ((type !== "news" && type !== "events" && type !== "partners") || !title || !body) {
      return res.status(400).json({ error: "type, title, and body are required." });
    }

    if (type === "news") {
      const item = await createOrUpdateArticle(db, bodyPayload as any);
      return res.json({ item });
    }

    if (type === "events") {
      const item = await createOrUpdateEvent(db, bodyPayload as any);
      return res.json({ item });
    }

    if (Boolean(bodyPayload.isPinned)) {
      await clearPinnedLegacyPartners(db);
    }

    const [item] = await db
      .insert(contentItems)
      .values({
        type: "partners",
        title,
        body,
        coverImage: bodyPayload.coverImage || null,
        coverAspect: normalizeCoverAspect(bodyPayload.coverAspect ?? bodyPayload.cover_aspect),
        ctaUrl: bodyPayload.ctaUrl || null,
        ctaLabel: bodyPayload.ctaLabel || "Open Link",
        isPinned: Boolean(bodyPayload.isPinned),
        publishToSite: Boolean(bodyPayload.publishToSite),
        publishToDashboard: Boolean(bodyPayload.publishToDashboard),
      })
      .returning();

    return res.json({ item: serializeLegacyContentItem(item) });
  } catch (error) {
    if (error instanceof Error && error.message === "Event end date must be after the start date.") {
      return res.status(400).json({ error: error.message });
    }

    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

    console.error("[Content /admin POST] Error:", error);
    res.status(500).json({ error: "Failed to create content item" });
  }
});

contentRouter.patch("/admin/:id", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  try {
    const db = requireDb();
    const id = getSingleValue(req.params.id);
    const bodyPayload = (req.body || {}) as Record<string, any>;
    const { type } = bodyPayload;

    if (!id) {
      return res.status(400).json({ error: "Invalid content item id" });
    }

    if (type === "news") {
      const item = await createOrUpdateArticle(db, { ...(bodyPayload as any), id });
      return res.json({ item });
    }

    if (type === "events") {
      const item = await createOrUpdateEvent(db, { ...(bodyPayload as any), id });
      return res.json({ item });
    }

    if (type !== "partners") {
      return res.status(400).json({ error: "Invalid content item type" });
    }

    if (Boolean(bodyPayload.isPinned)) {
      await clearPinnedLegacyPartners(db, id);
    }

    const [item] = await db
      .update(contentItems)
      .set({
        type: "partners",
        title: bodyPayload.title,
        body: bodyPayload.body,
        coverImage: bodyPayload.coverImage || null,
        coverAspect: normalizeCoverAspect(bodyPayload.coverAspect ?? bodyPayload.cover_aspect),
        ctaUrl: bodyPayload.ctaUrl || null,
        ctaLabel: bodyPayload.ctaLabel || "Open Link",
        isPinned: Boolean(bodyPayload.isPinned),
        publishToSite: Boolean(bodyPayload.publishToSite),
        publishToDashboard: Boolean(bodyPayload.publishToDashboard),
        updatedAt: new Date(),
      })
      .where(eq(contentItems.id, id))
      .returning();

    if (!item) {
      return res.status(404).json({ error: "Content item not found" });
    }

    return res.json({ item: serializeLegacyContentItem(item) });
  } catch (error) {
    if (error instanceof Error && error.message === "Event end date must be after the start date.") {
      return res.status(400).json({ error: error.message });
    }

    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

    console.error("[Content /admin PATCH] Error:", error);
    res.status(500).json({ error: "Failed to update content item" });
  }
});

contentRouter.delete("/admin/:id", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  try {
    const db = requireDb();
    const id = getSingleValue(req.params.id);
    let type = getSingleValue(req.query.type);

    if (!id) {
      return res.status(400).json({ error: "Invalid content item id" });
    }

    if (!type) {
      const [legacyItem] = await db.select({ type: contentItems.type }).from(contentItems).where(eq(contentItems.id, id)).limit(1);
      type = legacyItem?.type ?? null;
    }

    if (type === "news") {
      const item = await removeArticle(db, id);
      if (!item) {
        return res.status(404).json({ error: "Content item not found" });
      }
      return res.json({ success: true });
    }

    if (type === "events") {
      const item = await removeEvent(db, id);
      if (!item) {
        return res.status(404).json({ error: "Content item not found" });
      }
      return res.json({ success: true });
    }

    const [item] = await db.delete(contentItems).where(eq(contentItems.id, id)).returning();
    if (!item) {
      return res.status(404).json({ error: "Content item not found" });
    }

    return res.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

    console.error("[Content /admin DELETE] Error:", error);
    res.status(500).json({ error: "Failed to delete content item" });
  }
});
