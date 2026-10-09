import type { ContentImageMetadata } from "@/lib/content-image";

export type PublicContentItem = {
  id: string;
  type: "news" | "events" | "partners";
  title: string;
  body: string;
  coverImage?: string | null;
  coverAspect?: number | null;
  cover_aspect?: number | null;
  imageMetadata?: ContentImageMetadata | null;
  ctaUrl?: string | null;
  ctaLabel?: string | null;
  isPinned?: boolean;
  createdAt: string;
};

/** Accepts the backend's `items` payload and returns well-formed content items. */
export function normalizePublicContentItems(items: unknown): PublicContentItem[] {
  return Array.isArray(items)
    ? (items as PublicContentItem[]).map((item) => ({
        ...item,
        coverAspect: item.coverAspect ?? item.cover_aspect ?? null,
      }))
    : [];
}

/**
 * Formats a content timestamp the same way on the server and in the browser.
 * The timezone is pinned to UTC: these lists are server-rendered, and a
 * runtime-local date would differ near midnight between the server and a
 * visitor's browser, which React reports as a hydration mismatch.
 */
export function formatPublicContentDate(value: string, month: "long" | "short" = "long") {
  return new Date(value).toLocaleDateString("en-US", {
    month,
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export async function fetchPublicContent(type: "news" | "events" | "partners", target: "site" | "dashboard" = "site") {
  const res = await fetch(`/api/content?type=${type}&target=${target}`, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Failed to load content");
  }
  return normalizePublicContentItems(data.items);
}
