import crypto from "crypto";
import { requireDb } from "@/lib/db";
import { clearCanonicalPinnedArticles, clearLegacyPinnedArticles, deleteCanonicalArticle, deleteLegacyArticle, listCanonicalArticles, listLegacyArticles, upsertCanonicalArticle, upsertLegacyArticle, type ArticlePersistenceInput } from "./article.repository";

type DbClient = ReturnType<typeof requireDb>;

type ArticlePayload = {
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

function isMissingCanonicalTableError(error: unknown) {
  return error instanceof Error && error.message.includes('relation "ibpa.');
}

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
    type: "news",
    title: item.title,
    body: item.body,
    coverImage: item.coverImage ?? null,
    coverAspect: null,
    cover_aspect: null,
    eventAddress: null,
    eventAllDay: false,
    eventDate: null,
    eventEndDate: null,
    ctaUrl: item.ctaUrl ?? null,
    ctaLabel: item.ctaLabel ?? null,
    isPinned: Boolean(item.isPinned),
    publishToSite: Boolean(item.publishToSite),
    publishToDashboard: Boolean(item.publishToDashboard),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt ?? item.createdAt,
  };
}

function mapCanonicalArticle(item: Awaited<ReturnType<typeof listCanonicalArticles>>[number]) {
  return toCompatibilityShape({
    id: item.id,
    title: item.title,
    body: item.content,
    coverImage: item.coverImage,
    ctaUrl: item.ctaUrl,
    ctaLabel: item.ctaLabel,
    isPinned: item.isPinned,
    publishToSite: item.publishToSite,
    publishToDashboard: item.publishToDashboard,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  });
}

function mapLegacyArticle(item: Awaited<ReturnType<typeof listLegacyArticles>>[number]) {
  return toCompatibilityShape({
    id: item.id,
    title: item.title,
    body: item.body,
    coverImage: item.coverImage,
    ctaUrl: item.ctaUrl,
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

function normalizeArticlePayload(payload: ArticlePayload): ArticlePersistenceInput {
  const id = payload.id || crypto.randomUUID();

  return {
    id,
    title: payload.title.trim(),
    content: payload.body,
    coverImage: payload.coverImage ?? null,
    ctaUrl: payload.ctaUrl ?? null,
    ctaLabel: payload.ctaLabel ?? "Open Link",
    isPinned: Boolean(payload.isPinned),
    publishToSite: Boolean(payload.publishToSite),
    publishToDashboard: Boolean(payload.publishToDashboard),
  };
}

export async function listPublicArticles(db: DbClient, target: "site" | "dashboard") {
  const adminItems = await listAdminArticles(db);
  return adminItems.filter((item) => (target === "dashboard" ? item.publishToDashboard : item.publishToSite));
}

export async function listAdminArticles(db: DbClient) {
  const merged: Array<ReturnType<typeof toCompatibilityShape>> = [];

  try {
    const canonical = await listCanonicalArticles(db);
    merged.push(...canonical.map(mapCanonicalArticle));
  } catch (error) {
    if (!isMissingCanonicalTableError(error)) {
      throw error;
    }
  }

  const legacy = await listLegacyArticles(db);
  merged.push(...legacy.map(mapLegacyArticle));

  return mergeById(merged).sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createOrUpdateArticle(db: DbClient, payload: ArticlePayload) {
  const normalized = normalizeArticlePayload(payload);

  if (normalized.isPinned) {
    await clearLegacyPinnedArticles(db, normalized.id);
    try {
      await clearCanonicalPinnedArticles(db, normalized.id);
    } catch (error) {
      if (!isMissingCanonicalTableError(error)) {
        throw error;
      }
    }
  }

  const legacy = await upsertLegacyArticle(db, normalized);

  try {
    await upsertCanonicalArticle(db, normalized);
  } catch (error) {
    if (!isMissingCanonicalTableError(error)) {
      throw error;
    }
  }

  return mapLegacyArticle(legacy);
}

export async function removeArticle(db: DbClient, id: string) {
  const deletedLegacy = await deleteLegacyArticle(db, id);

  try {
    await deleteCanonicalArticle(db, id);
  } catch (error) {
    if (!isMissingCanonicalTableError(error)) {
      throw error;
    }
  }

  return deletedLegacy;
}
