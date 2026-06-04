import crypto from "crypto";
import { requireDb } from "@/lib/db";
import { clearCanonicalPinnedEvents, clearLegacyPinnedEvents, deleteCanonicalEvent, deleteLegacyEvent, listCanonicalEvents, listLegacyEvents, upsertCanonicalEvent, upsertLegacyEvent, type EventPersistenceInput } from "./event.repository";

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

function isMissingCanonicalTableError(error: unknown) {
  return error instanceof Error && error.message.includes('relation "ibpa.');
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

function mapLegacyEvent(item: Awaited<ReturnType<typeof listLegacyEvents>>[number]) {
  return toCompatibilityShape({
    id: item.id,
    title: item.title,
    description: item.body,
    coverImageUrl: item.coverImage,
    coverAspect: item.coverAspect ?? null,
    location: item.eventAddress,
    eventAllDay: item.eventAllDay,
    startDate: item.eventDate,
    endDate: item.eventEndDate,
    eventLink: item.ctaUrl,
    ctaLabel: item.ctaLabel,
    isPinned: item.isPinned,
    publishToSite: item.publishToSite,
    publishToDashboard: item.publishToDashboard,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  });
}

function mergeById(items: Array<ReturnType<typeof toCompatibilityShape>>) {
  const records = new Map<string, ReturnType<typeof toCompatibilityShape>>();

  for (const item of items) {
    if (!records.has(item.id)) {
      records.set(item.id, item);
    }
  }

  return Array.from(records.values());
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

  return canonicalItems.filter((item) => (target === "dashboard" ? item.publishToDashboard : item.publishToSite));
}

export async function listAdminEvents(db: DbClient) {
  const merged: Array<ReturnType<typeof toCompatibilityShape>> = [];

  try {
    const canonical = await listCanonicalEvents(db);
    merged.push(...canonical.map(mapCanonicalEvent));
  } catch (error) {
    if (!isMissingCanonicalTableError(error)) {
      throw error;
    }
  }

  const legacy = await listLegacyEvents(db);
  merged.push(...legacy.map(mapLegacyEvent));

  return mergeById(merged).sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createOrUpdateEvent(db: DbClient, payload: EventPayload) {
  const normalized = normalizeEventPayload(payload);

  const start = normalized.startDate;
  const end = normalized.endDate;
  if (start && end && end.getTime() < start.getTime()) {
    throw new Error("Event end date must be after the start date.");
  }

  if (normalized.isPinned) {
    await clearLegacyPinnedEvents(db, normalized.id);
    try {
      await clearCanonicalPinnedEvents(db, normalized.id);
    } catch (error) {
      if (!isMissingCanonicalTableError(error)) {
        throw error;
      }
    }
  }

  const legacy = await upsertLegacyEvent(db, normalized);

  try {
    await upsertCanonicalEvent(db, normalized);
  } catch (error) {
    if (!isMissingCanonicalTableError(error)) {
      throw error;
    }
  }

  return mapLegacyEvent(legacy);
}

export async function removeEvent(db: DbClient, id: string) {
  const deletedLegacy = await deleteLegacyEvent(db, id);

  try {
    await deleteCanonicalEvent(db, id);
  } catch (error) {
    if (!isMissingCanonicalTableError(error)) {
      throw error;
    }
  }

  return deletedLegacy;
}
