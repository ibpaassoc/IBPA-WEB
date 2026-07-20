import { and, desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreEventRegistrations, coreEvents, coreProfiles, coreUsers } from "@/lib/schema";
import type { ContentImageMetadata } from "@/features/content/image-metadata";

type DbClient = ReturnType<typeof requireDb>;

export type EventPersistenceInput = {
  id: string;
  title: string;
  description: string;
  price?: string | null;
  coverImageUrl?: string | null;
  coverAspect?: number | null;
  coverZoom?: number | null;
  imageMetadata?: ContentImageMetadata | null;
  location?: string | null;
  visibility: string;
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

export async function listDashboardEvents(db: DbClient) {
  return db
    .select()
    .from(coreEvents)
    .where(eq(coreEvents.publishToDashboard, true))
    .orderBy(desc(coreEvents.isPinned), desc(coreEvents.createdAt));
}

export async function findCanonicalEventById(db: DbClient, id: string) {
  const [event] = await db.select().from(coreEvents).where(eq(coreEvents.id, id)).limit(1);
  return event ?? null;
}

export async function listEventRegistrationsByUserId(db: DbClient, userId: string) {
  return db
    .select()
    .from(coreEventRegistrations)
    .where(eq(coreEventRegistrations.userId, userId))
    .orderBy(desc(coreEventRegistrations.registeredAt), desc(coreEventRegistrations.createdAt));
}

export async function listEventRegistrationsByEventId(db: DbClient, eventId: string) {
  return db
    .select({
      registration: coreEventRegistrations,
      user: coreUsers,
      profile: coreProfiles,
    })
    .from(coreEventRegistrations)
    .leftJoin(coreUsers, eq(coreUsers.id, coreEventRegistrations.userId))
    .leftJoin(coreProfiles, eq(coreProfiles.userId, coreEventRegistrations.userId))
    .where(eq(coreEventRegistrations.eventId, eventId))
    .orderBy(desc(coreEventRegistrations.registeredAt), desc(coreEventRegistrations.createdAt));
}

export async function findEventRegistrationByEventAndUser(
  db: DbClient,
  params: {
    eventId: string;
    userId: string;
  },
) {
  const [registration] = await db
    .select()
    .from(coreEventRegistrations)
    .where(
      and(
        eq(coreEventRegistrations.eventId, params.eventId),
        eq(coreEventRegistrations.userId, params.userId),
      ),
    )
    .limit(1);

  return registration ?? null;
}

export async function upsertEventRegistration(
  db: DbClient,
  input: {
    id: string;
    eventId: string;
    userId: string;
    email: string;
    source: string;
    status: "REGISTERED" | "WAITLISTED" | "CANCELLED" | "ATTENDED";
    registeredAt?: Date;
    cancelledAt?: Date | null;
  },
) {
  const existing = await findEventRegistrationByEventAndUser(db, {
    eventId: input.eventId,
    userId: input.userId,
  });

  if (existing) {
    const [updated] = await db
      .update(coreEventRegistrations)
      .set({
        email: input.email,
        source: input.source,
        status: input.status,
        registeredAt: input.registeredAt ?? existing.registeredAt,
        cancelledAt: input.cancelledAt ?? null,
        updatedAt: new Date(),
      })
      .where(eq(coreEventRegistrations.id, existing.id))
      .returning();

    return { record: updated ?? existing, created: false };
  }

  const [created] = await db
    .insert(coreEventRegistrations)
    .values({
      id: input.id,
      eventId: input.eventId,
      userId: input.userId,
      email: input.email,
      source: input.source,
      status: input.status,
      registeredAt: input.registeredAt ?? new Date(),
      cancelledAt: input.cancelledAt ?? null,
    })
    .returning();

  return { record: created, created: true };
}

export async function deleteEventRegistrationByEventAndUser(
  db: DbClient,
  params: {
    eventId: string;
    userId: string;
  },
) {
  const existing = await findEventRegistrationByEventAndUser(db, params);

  if (!existing) {
    return null;
  }

  const [deleted] = await db
    .delete(coreEventRegistrations)
    .where(eq(coreEventRegistrations.id, existing.id))
    .returning();

  return deleted ?? existing;
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
        coverImage: input.coverImageUrl
          ? { url: input.coverImageUrl, aspect: input.coverAspect ?? null, zoom: input.coverZoom ?? null }
          : null,
        imagePresentation:
          input.imageMetadata === undefined
            ? input.coverImageUrl !== undefined && input.coverImageUrl !== existing.coverImage?.url
              ? null
              : existing.imagePresentation
            : input.imageMetadata,
        location: input.location ?? null,
        visibility: input.visibility,
        price: input.price ?? existing.price,
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
      coverImage: input.coverImageUrl
        ? { url: input.coverImageUrl, aspect: input.coverAspect ?? null, zoom: input.coverZoom ?? null }
        : null,
      imagePresentation: input.imageMetadata ?? null,
      location: input.location ?? null,
      visibility: input.visibility,
      price: input.price ?? null,
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
