import crypto from "crypto";
import { requireDb } from "@/lib/db";
import type { CoreEventRegistration } from "@/lib/schema";
import {
  clearCanonicalPinnedEvents,
  deleteEventRegistrationByEventAndUser,
  deleteCanonicalEvent,
  findCanonicalEventById,
  findEventRegistrationByEventAndUser,
  listCanonicalEvents,
  listDashboardEvents,
  listEventRegistrationsByEventId,
  listEventRegistrationsByUserId,
  upsertCanonicalEvent,
  upsertEventRegistration,
  type EventPersistenceInput,
} from "./event.repository";

type DbClient = ReturnType<typeof requireDb>;

type EventPayload = {
  id?: string;
  title: string;
  body: string;
  coverImage?: string | null;
  coverAspect?: number | null;
  eventAddress?: string | null;
  eventAllDay?: boolean;
  eventDate?: string | Date | null;
  eventEndDate?: string | Date | null;
  ctaUrl?: string | null;
  ctaLabel?: string | null;
  isPinned?: boolean;
  publishToSite?: boolean;
  publishToDashboard?: boolean;
};

function parseDate(value: string | Date | null | undefined) {
  if (!value) {
    return null;
  }

  const next = value instanceof Date ? value : new Date(value);
  return Number.isNaN(next.getTime()) ? null : next;
}

function resolveVisibility(publishToSite?: boolean, publishToDashboard?: boolean) {
  if (publishToSite && publishToDashboard) return "BOTH";
  if (publishToSite) return "SITE";
  if (publishToDashboard) return "DASHBOARD";
  return "PRIVATE";
}

function resolveStatus(publishToSite?: boolean, publishToDashboard?: boolean) {
  return publishToSite || publishToDashboard ? "PUBLISHED" : "DRAFT";
}

function toCompatibilityShape(item: {
  id: string;
  title: string;
  description: string;
  coverImageUrl?: string | null;
  coverAspect?: number | null;
  location?: string | null;
  eventAllDay?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  eventLink?: string | null;
  ctaLabel?: string | null;
  isPinned?: boolean;
  publishToSite?: boolean;
  publishToDashboard?: boolean;
  createdAt: Date;
  updatedAt?: Date | null;
}) {
  const coverAspect = item.coverAspect ?? null;

  return {
    id: item.id,
    type: "events",
    title: item.title,
    body: item.description,
    coverImage: item.coverImageUrl ?? null,
    coverAspect,
    cover_aspect: coverAspect,
    eventAddress: item.location ?? null,
    eventAllDay: Boolean(item.eventAllDay),
    eventDate: item.startDate ?? null,
    eventEndDate: item.endDate ?? null,
    ctaUrl: item.eventLink ?? null,
    ctaLabel: item.ctaLabel ?? null,
    isPinned: Boolean(item.isPinned),
    publishToSite: Boolean(item.publishToSite),
    publishToDashboard: Boolean(item.publishToDashboard),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt ?? item.createdAt,
  };
}

function mapCanonicalEvent(item: Awaited<ReturnType<typeof listCanonicalEvents>>[number]) {
  return toCompatibilityShape({
    id: item.id,
    title: item.title,
    description: item.description,
    coverImageUrl: item.coverImage?.url ?? null,
    coverAspect: item.coverImage?.aspect ?? null,
    location: item.location,
    eventAllDay: item.eventAllDay,
    startDate: item.startDate,
    endDate: item.endDate,
    eventLink: item.eventLink,
    ctaLabel: item.ctaLabel,
    isPinned: item.isPinned,
    publishToSite: item.publishToSite,
    publishToDashboard: item.publishToDashboard,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  });
}

function normalizeEventPayload(payload: EventPayload): EventPersistenceInput {
  const id = payload.id || crypto.randomUUID();
  return {
    id,
    title: payload.title.trim(),
    description: payload.body,
    coverImageUrl: payload.coverImage ?? null,
    coverAspect: payload.coverAspect ?? null,
    location: payload.eventAddress ?? null,
    visibility: resolveVisibility(payload.publishToSite, payload.publishToDashboard),
    eventLink: payload.ctaUrl ?? null,
    eventAllDay: Boolean(payload.eventAllDay),
    ctaLabel: payload.ctaLabel ?? "Open Event",
    isPinned: Boolean(payload.isPinned),
    publishToSite: Boolean(payload.publishToSite),
    publishToDashboard: Boolean(payload.publishToDashboard),
    startDate: parseDate(payload.eventDate),
    endDate: parseDate(payload.eventEndDate),
    status: resolveStatus(payload.publishToSite, payload.publishToDashboard),
  };
}

export async function listPublicEvents(db: DbClient, target: "site" | "dashboard") {
  const canonicalItems = await listAdminEvents(db);

  return canonicalItems.filter((item: any) => (target === "dashboard" ? item.publishToDashboard : item.publishToSite));
}

export async function listAdminEventRegistrations(db: DbClient, eventId: string) {
  const rows = await listEventRegistrationsByEventId(db, eventId);

  return rows.map((row: Awaited<ReturnType<typeof listEventRegistrationsByEventId>>[number]) => {
    const profileName = [row.profile?.firstName, row.profile?.lastName].filter(Boolean).join(" ");

    return {
      id: row.registration.id,
      eventId: row.registration.eventId,
      userId: row.registration.userId,
      email: row.registration.email || row.user?.email || "",
      name: profileName || row.user?.email || "Registered user",
      status: row.registration.status,
      source: row.registration.source,
      registeredAt: row.registration.registeredAt,
      cancelledAt: row.registration.cancelledAt,
      profileId: row.profile?.id ?? null,
    };
  });
}

function isActiveRegistration(registration: {
  status: string;
  cancelledAt?: Date | null;
} | null | undefined) {
  if (!registration) {
    return false;
  }

  return registration.status !== "CANCELLED" && !registration.cancelledAt;
}

export async function listDashboardEventsForUser(
  db: DbClient,
  params: {
    userId?: string | null;
  },
) {
  const [events, registrations] = await Promise.all([
    listDashboardEvents(db),
    params.userId
      ? listEventRegistrationsByUserId(db, params.userId)
      : Promise.resolve([] as CoreEventRegistration[]),
  ]);

  const registrationsByEventId = new Map<string, CoreEventRegistration>(
    registrations.map((registration: CoreEventRegistration) => [
      registration.eventId,
      registration,
    ]),
  );

  return events.map((item: (typeof events)[number]) => {
    const registration: CoreEventRegistration | null =
      registrationsByEventId.get(item.id) ?? null;
    return {
      ...mapCanonicalEvent(item),
      isRegistered: isActiveRegistration(registration),
      registrationId: registration?.id ?? null,
      registrationStatus: registration?.status ?? null,
      registrationSource: registration?.source ?? null,
    };
  });
}

export async function registerDashboardEvent(
  db: DbClient,
  input: {
    eventId: string;
    userId: string;
    email: string;
    source?: string;
  },
) {
  const event = await findCanonicalEventById(db, input.eventId);

  if (!event || !event.publishToDashboard) {
    throw new Error("Event not found.");
  }

  const existing = await findEventRegistrationByEventAndUser(db, {
    eventId: input.eventId,
    userId: input.userId,
  });

  const registrationResult = await upsertEventRegistration(db, {
    id: existing?.id ?? crypto.randomUUID(),
    eventId: input.eventId,
    userId: input.userId,
    email: input.email,
    source: input.source ?? "dashboard",
    status: "REGISTERED",
    registeredAt: new Date(),
    cancelledAt: null,
  });

  return {
    event: {
      ...mapCanonicalEvent(event),
      isRegistered: true,
      registrationId: registrationResult.record.id,
      registrationStatus: registrationResult.record.status,
      registrationSource: registrationResult.record.source,
    },
    alreadyRegistered: isActiveRegistration(existing),
    created: registrationResult.created,
  };
}

export async function unregisterDashboardEvent(
  db: DbClient,
  input: {
    eventId: string;
    userId: string;
  },
) {
  const event = await findCanonicalEventById(db, input.eventId);

  if (!event || !event.publishToDashboard) {
    throw new Error("Event not found.");
  }

  const deleted = await deleteEventRegistrationByEventAndUser(db, {
    eventId: input.eventId,
    userId: input.userId,
  });

  return {
    event: {
      ...mapCanonicalEvent(event),
      isRegistered: false,
      registrationId: null,
      registrationStatus: null,
      registrationSource: null,
    },
    removed: Boolean(deleted),
  };
}

export async function listAdminEvents(db: DbClient) {
  const canonical = await listCanonicalEvents(db);
  return canonical
    .map(mapCanonicalEvent)
    .sort((a: any, b: any) => Number(b.isPinned) - Number(a.isPinned) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createOrUpdateEvent(db: DbClient, payload: EventPayload) {
  const normalized = normalizeEventPayload(payload);

  const start = normalized.startDate;
  const end = normalized.endDate;
  if (start && end && end.getTime() < start.getTime()) {
    throw new Error("Event end date must be after the start date.");
  }

  if (normalized.isPinned) {
    await clearCanonicalPinnedEvents(db, normalized.id);
  }

  const result = await upsertCanonicalEvent(db, normalized);
  return mapCanonicalEvent(result.record);
}

export async function removeEvent(db: DbClient, id: string) {
  return deleteCanonicalEvent(db, id);
}
