import { and, desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreEvents } from "@/lib/schema";

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

export async function deleteCanonicalEvent(db: DbClient, id: string) {
  const [deleted] = await db.delete(coreEvents).where(eq(coreEvents.id, id)).returning();
  return deleted ?? null;
}
