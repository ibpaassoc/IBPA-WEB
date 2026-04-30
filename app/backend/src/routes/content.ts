import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { contentItems, requireDb } from "../lib/db";
import { adminClerkMiddleware, requireAdminAccess } from "../services/admin";

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

async function clearPinnedForType(db: ReturnType<typeof requireDb>, type: "news" | "events" | "partners", excludeId?: string) {
  const existing = await db.select().from(contentItems).where(eq(contentItems.type, type));
  const pinnedIds = existing
    .filter((item: any) => item.isPinned && item.id !== excludeId)
    .map((item: any) => item.id);

  for (const id of pinnedIds) {
    await db.update(contentItems).set({ isPinned: false, updatedAt: new Date() }).where(eq(contentItems.id, id));
  }
}

contentRouter.get("/public", async (req, res) => {
  try {
    const db = requireDb();
    const { type, target } = req.query;

    if (type !== "news" && type !== "events" && type !== "partners") {
      return res.status(400).json({ error: "Query param 'type' must be 'news', 'events', or 'partners'." });
    }

    if (type === "partners" && target === "dashboard") {
      return res.json({ items: [] });
    }

    const targetFilter =
      target === "dashboard"
        ? eq(contentItems.publishToDashboard, true)
        : eq(contentItems.publishToSite, true);

    const items = await db
      .select()
      .from(contentItems)
      .where(and(eq(contentItems.type, type), targetFilter))
      .orderBy(desc(contentItems.isPinned), desc(contentItems.createdAt));

    res.json({ items });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("[Content /public] Error:", error);
    res.status(500).json({ error: "Failed to fetch content" });
  }
});

contentRouter.get("/admin", adminClerkMiddleware, requireAdminAccess, async (_req, res) => {
  try {
    const db = requireDb();
    const items = await db.select().from(contentItems).orderBy(desc(contentItems.isPinned), desc(contentItems.createdAt));
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
    const {
      type,
      title,
      body,
      coverImage,
      eventAddress,
      eventAllDay,
      eventDate,
      eventEndDate,
      ctaUrl,
      ctaLabel,
      isPinned,
      publishToSite,
      publishToDashboard,
    } = req.body || {};

    if ((type !== "news" && type !== "events" && type !== "partners") || !title || !body) {
      return res.status(400).json({ error: "type, title, and body are required." });
    }

    if (type === "events" && eventDate && eventEndDate) {
      const start = new Date(eventDate);
      const end = new Date(eventEndDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return res.status(400).json({ error: "Invalid event start or end date." });
      }
      if (end.getTime() < start.getTime()) {
        return res.status(400).json({ error: "Event end date must be after the start date." });
      }
    }

    if (Boolean(isPinned) && (type === "news" || type === "events" || type === "partners")) {
      await clearPinnedForType(db, type);
    }

    const [item] = await db
      .insert(contentItems)
      .values({
        type,
        title,
        body,
        coverImage: coverImage || null,
        eventAddress: type === "events" ? eventAddress || null : null,
        eventAllDay: type === "events" ? Boolean(eventAllDay) : false,
        eventDate: type === "events" && eventDate ? new Date(eventDate) : null,
        eventEndDate: type === "events" && eventEndDate ? new Date(eventEndDate) : null,
        ctaUrl: ctaUrl || null,
        ctaLabel: ctaLabel || "Open Link",
        isPinned: Boolean(isPinned),
        publishToSite: Boolean(publishToSite),
        publishToDashboard: Boolean(publishToDashboard),
      })
      .returning();

    res.json({ item });
  } catch (error) {
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
    const {
      type,
      title,
      body,
      coverImage,
      eventAddress,
      eventAllDay,
      eventDate,
      eventEndDate,
      ctaUrl,
      ctaLabel,
      isPinned,
      publishToSite,
      publishToDashboard,
    } = req.body || {};

    if (!id) {
      return res.status(400).json({ error: "Invalid content item id" });
    }

    if ((type === "news" || type === "events" || type === "partners") && Boolean(isPinned)) {
      await clearPinnedForType(db, type, id);
    }

    if (type === "events" && eventDate && eventEndDate) {
      const start = new Date(eventDate);
      const end = new Date(eventEndDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return res.status(400).json({ error: "Invalid event start or end date." });
      }
      if (end.getTime() < start.getTime()) {
        return res.status(400).json({ error: "Event end date must be after the start date." });
      }
    }

    const [item] = await db
      .update(contentItems)
      .set({
        type,
        title,
        body,
        coverImage: coverImage || null,
        eventAddress: type === "events" ? eventAddress || null : null,
        eventAllDay: type === "events" ? Boolean(eventAllDay) : false,
        eventDate: type === "events" && eventDate ? new Date(eventDate) : null,
        eventEndDate: type === "events" && eventEndDate ? new Date(eventEndDate) : null,
        ctaUrl: ctaUrl || null,
        ctaLabel: ctaLabel || "Open Link",
        isPinned: Boolean(isPinned),
        publishToSite: Boolean(publishToSite),
        publishToDashboard: Boolean(publishToDashboard),
        updatedAt: new Date(),
      })
      .where(eq(contentItems.id, id))
      .returning();

    if (!item) {
      return res.status(404).json({ error: "Content item not found" });
    }

    res.json({ item });
  } catch (error) {
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

    if (!id) {
      return res.status(400).json({ error: "Invalid content item id" });
    }

    const [item] = await db.delete(contentItems).where(eq(contentItems.id, id)).returning();

    if (!item) {
      return res.status(404).json({ error: "Content item not found" });
    }

    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }
    console.error("[Content /admin DELETE] Error:", error);
    res.status(500).json({ error: "Failed to delete content item" });
  }
});
