import { and, desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { contentItems, coreEvents } from "@/lib/schema";

type DbClient = ReturnType<typeof requireDb>;

export type EventPersistenceInput = {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string | null;
  coverAspect?: number | null;
  location?: string | null;
  visibility: string;
  price?: number;
  capacity?: number | null;
  eventLink?: string | null;
  eventAllDay?: boolean;
  ctaLabel?: string | null;
  isPinned?: boolean;
  publishToSite?: boolean;
  publishToDashboard?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  status: string;
};

export async function listCanonicalEvents(db: DbClient) {
  return db.select().from(coreEvents).orderBy(desc(coreEvents.isPinned), desc(coreEvents.createdAt));
}

export async function listLegacyEvents(db: DbClient) {
  return db
    .select()
    .from(contentItems)
    .where(eq(contentItems.type, "events"))
    .orderBy(desc(contentItems.isPinned), desc(contentItems.createdAt));
}

export async function clearLegacyPinnedEvents(db: DbClient, excludeId?: string) {
  const existing = await db.select().from(contentItems).where(eq(contentItems.type, "events"));
  const pinnedIds = existing.filter((item: typeof contentItems.$inferSelect) => item.isPinned && item.id !== excludeId).map((item: typeof contentItems.$inferSelect) => item.id);

  for (const id of pinnedIds) {
    await db.update(contentItems).set({ isPinned: false, updatedAt: new Date() }).where(eq(contentItems.id, id));
  }
}

export async function clearCanonicalPinnedEvents(db: DbClient, excludeId?: string) {
  const existing = await db.select().from(coreEvents);
  const pinnedIds = existing.filter((item: typeof coreEvents.$inferSelect) => item.isPinned && item.id !== excludeId).map((item: typeof coreEvents.$inferSelect) => item.id);

  for (const id of pinnedIds) {
    await db.update(coreEvents).set({ isPinned: false, updatedAt: new Date() }).where(eq(coreEvents.id, id));
  }
}

export async function upsertCanonicalEvent(db: DbClient, input: EventPersistenceInput) {
  const [existing] = await db.select().from(coreEvents).where(eq(coreEvents.id, input.id)).limit(1);

  if (existing) {
    const [updated] = await db
      .update(coreEvents)
      .set({
        title: input.title,
        description: input.description,
        coverImage: input.coverImageUrl ? { url: input.coverImageUrl, aspect: input.coverAspect ?? null } : null,
        location: input.location ?? null,
        visibility: input.visibility,
        price: input.price ?? existing.price,
        capacity: input.capacity ?? existing.capacity,
        eventLink: input.eventLink ?? null,
        eventAllDay: Boolean(input.eventAllDay),
        ctaLabel: input.ctaLabel ?? null,
        isPinned: Boolean(input.isPinned),
        publishToSite: Boolean(input.publishToSite),
        publishToDashboard: Boolean(input.publishToDashboard),
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(coreEvents.id, input.id))
      .returning();

    return { record: updated ?? existing, created: false };
  }

  const [created] = await db
    .insert(coreEvents)
    .values({
      id: input.id,
      title: input.title,
      description: input.description,
      coverImage: input.coverImageUrl ? { url: input.coverImageUrl, aspect: input.coverAspect ?? null } : null,
      location: input.location ?? null,
      visibility: input.visibility,
      price: input.price ?? 0,
      capacity: input.capacity ?? null,
      eventLink: input.eventLink ?? null,
      eventAllDay: Boolean(input.eventAllDay),
      ctaLabel: input.ctaLabel ?? null,
      isPinned: Boolean(input.isPinned),
      publishToSite: Boolean(input.publishToSite),
      publishToDashboard: Boolean(input.publishToDashboard),
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      status: input.status,
    })
    .returning();

  return { record: created, created: true };
}

export async function upsertLegacyEvent(db: DbClient, input: EventPersistenceInput) {
  const [existing] = await db.select().from(contentItems).where(and(eq(contentItems.id, input.id), eq(contentItems.type, "events"))).limit(1);

  if (existing) {
    const [updated] = await db
      .update(contentItems)
      .set({
        type: "events",
        title: input.title,
        body: input.description,
        coverImage: input.coverImageUrl ?? null,
        coverAspect: input.coverAspect ?? null,
        eventAddress: input.location ?? null,
        eventAllDay: Boolean(input.eventAllDay),
        eventDate: input.startDate ?? null,
        eventEndDate: input.endDate ?? null,
        ctaUrl: input.eventLink ?? null,
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
      type: "events",
      title: input.title,
      body: input.description,
      coverImage: input.coverImageUrl ?? null,
      coverAspect: input.coverAspect ?? null,
      eventAddress: input.location ?? null,
      eventAllDay: Boolean(input.eventAllDay),
      eventDate: input.startDate ?? null,
      eventEndDate: input.endDate ?? null,
      ctaUrl: input.eventLink ?? null,
      ctaLabel: input.ctaLabel ?? null,
      isPinned: Boolean(input.isPinned),
      publishToSite: Boolean(input.publishToSite),
      publishToDashboard: Boolean(input.publishToDashboard),
    })
    .returning();

  return created;
}

export async function deleteCanonicalEvent(db: DbClient, id: string) {
  const [deleted] = await db.delete(coreEvents).where(eq(coreEvents.id, id)).returning();
  return deleted ?? null;
}

export async function deleteLegacyEvent(db: DbClient, id: string) {
  const [deleted] = await db.delete(contentItems).where(and(eq(contentItems.id, id), eq(contentItems.type, "events"))).returning();
  return deleted ?? null;
}
