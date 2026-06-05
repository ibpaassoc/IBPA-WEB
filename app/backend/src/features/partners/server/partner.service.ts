import crypto from "crypto";
import { requireDb } from "@/lib/db";
import {
  clearCanonicalPinnedPartners,
  deleteCanonicalPartner,
  listCanonicalPartners,
  type PartnerPersistenceInput,
  upsertCanonicalPartner,
} from "./partner.repository";

type DbClient = ReturnType<typeof requireDb>;

type PartnerPayload = {
  id?: string;
  title: string;
  body: string;
  coverImage?: string | null;
  ctaUrl?: string | null;
  ctaLabel?: string | null;
  isPinned?: boolean;
  publishToSite?: boolean;
  publishToDashboard?: boolean;
};

function toCompatibilityShape(item: {
  id: string;
  title: string;
  body: string;
  coverImage?: string | null;
  ctaUrl?: string | null;
  ctaLabel?: string | null;
  isPinned?: boolean;
  publishToSite?: boolean;
  publishToDashboard?: boolean;
  createdAt: Date;
  updatedAt?: Date | null;
}) {
  return {
    id: item.id,
    type: "partners",
    title: item.title,
    body: item.body,
    coverImage: item.coverImage ?? null,
    coverAspect: null,
    cover_aspect: null,
    ctaUrl: item.ctaUrl ?? null,
    ctaLabel: item.ctaLabel ?? null,
    isPinned: Boolean(item.isPinned),
    publishToSite: Boolean(item.publishToSite),
    publishToDashboard: Boolean(item.publishToDashboard),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt ?? item.createdAt,
  };
}

function mapCanonicalPartner(item: Awaited<ReturnType<typeof listCanonicalPartners>>[number]) {
  return toCompatibilityShape(item);
}

function normalizePartnerPayload(payload: PartnerPayload): PartnerPersistenceInput {
  return {
    id: payload.id || crypto.randomUUID(),
    title: payload.title.trim(),
    body: payload.body.trim(),
    coverImage: payload.coverImage ?? null,
    ctaUrl: payload.ctaUrl ?? null,
    ctaLabel: payload.ctaLabel ?? null,
    isPinned: Boolean(payload.isPinned),
    publishToSite: Boolean(payload.publishToSite),
    publishToDashboard: Boolean(payload.publishToDashboard),
  };
}

export async function listPublicPartners(db: DbClient) {
  const items = await listCanonicalPartners(db);
  return items
    .filter((item: Awaited<ReturnType<typeof listCanonicalPartners>>[number]) => item.publishToSite)
    .map(mapCanonicalPartner);
}

export async function listAdminPartners(db: DbClient) {
  const items = await listCanonicalPartners(db);
  return items.map(mapCanonicalPartner);
}

export async function createOrUpdatePartner(db: DbClient, payload: PartnerPayload) {
  const normalized = normalizePartnerPayload(payload);

  if (normalized.isPinned) {
    await clearCanonicalPinnedPartners(db, normalized.id);
  }

  const result = await upsertCanonicalPartner(db, normalized);
  return mapCanonicalPartner(result.record);
}

export async function removePartner(db: DbClient, id: string) {
  return deleteCanonicalPartner(db, id);
}
