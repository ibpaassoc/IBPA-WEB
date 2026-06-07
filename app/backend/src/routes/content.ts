import { Router } from "express";
import { eq } from "drizzle-orm";
import { requireDb } from "../lib/db";
import { coreArticles, coreEvents, corePartners } from "../lib/schema";
import { adminClerkMiddleware, requireAdminAccess } from "../services/admin";
import { createOrUpdateEvent, listAdminEventRegistrations, listAdminEvents, listPublicEvents, removeEvent } from "../features/events/server/event.service";
import { createOrUpdateArticle, listAdminArticles, listPublicArticles, removeArticle } from "../features/news/server/article.service";
import { createOrUpdatePartner, listAdminPartners, listPublicPartners, removePartner } from "../features/partners/server/partner.service";

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

    const items = await listPublicPartners(db);
    return res.json({ items });
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
      listAdminPartners(db),
    ]);

    const items = [...events, ...articles, ...partners]
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

contentRouter.get("/admin/events/:id/registrations", adminClerkMiddleware, requireAdminAccess, async (req, res) => {
  try {
    const db = requireDb();
    const id = getSingleValue(req.params.id);

    if (!id) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const items = await listAdminEventRegistrations(db, id);
    return res.json({
      items,
      total: items.length,
      counts: {
        attended: items.filter((item: { status: string }) => item.status === "ATTENDED").length,
        cancelled: items.filter((item: { status: string }) => item.status === "CANCELLED").length,
        registered: items.filter((item: { status: string }) => item.status === "REGISTERED").length,
        waitlisted: items.filter((item: { status: string }) => item.status === "WAITLISTED").length,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("DATABASE_URL")) {
      return res.status(503).json({ error: error.message });
    }

    console.error("[Content /admin/events/:id/registrations GET] Error:", error);
    return res.status(500).json({ error: "Failed to fetch event registrations" });
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

    const item = await createOrUpdatePartner(db, bodyPayload as any);
    return res.json({ item });
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

    const item = await createOrUpdatePartner(db, { ...(bodyPayload as any), id });
    return res.json({ item });
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
      const [eventRecord, articleRecord, partnerRecord] = await Promise.all([
        db.select({ id: coreEvents.id }).from(coreEvents).where(eq(coreEvents.id, id)).limit(1),
        db.select({ id: coreArticles.id }).from(coreArticles).where(eq(coreArticles.id, id)).limit(1),
        db.select({ id: corePartners.id }).from(corePartners).where(eq(corePartners.id, id)).limit(1),
      ]);

      if (eventRecord[0]) {
        type = "events";
      } else if (articleRecord[0]) {
        type = "news";
      } else if (partnerRecord[0]) {
        type = "partners";
      }
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

    const item = await removePartner(db, id);
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
