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

export async function fetchPublicContent(type: "news" | "events" | "partners", target: "site" | "dashboard" = "site") {
  const res = await fetch(`/api/content?type=${type}&target=${target}`, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Failed to load content");
  }
  return Array.isArray(data.items)
    ? (data.items as PublicContentItem[]).map((item) => ({
        ...item,
        coverAspect: item.coverAspect ?? item.cover_aspect ?? null,
      }))
    : [];
}
