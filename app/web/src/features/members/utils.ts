import { getPublicProfilePreviewHref } from "@/lib/member-identity";
import { getMembershipCategory, membershipConfigById } from "@/lib/membership";
import type { MembersLocale, PublicMember } from "./types";

/**
 * Public preview profile URL for a member card. Reuses the existing preview
 * flow (`/profile-preview/[id]`) and identifier pattern — no new routing.
 */
export function getMemberProfileHref(member: Pick<PublicMember, "id">) {
  return getPublicProfilePreviewHref(member.id);
}

/** Up-to-two-letter fallback used when a member has no avatar image. */
export function getMemberInitials(name: string) {
  const initials = name
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return initials || "IB";
}

/** "City, Country" — gracefully collapses when either half is missing. */
export function getMemberLocation(member: Pick<PublicMember, "location" | "city" | "country">) {
  if (member.location) {
    return member.location;
  }

  return [member.city, member.country].filter(Boolean).join(", ");
}

/** Primary specialization / category line for a card. */
export function getMemberSpecialization(
  member: Pick<PublicMember, "specializations" | "title">,
) {
  const specializations = (member.specializations ?? []).filter(Boolean);
  if (specializations.length > 0) {
    return specializations.join(", ");
  }

  return member.title?.trim() || "";
}

/**
 * Localized membership badge label. Falls back to the raw membership type when
 * it does not map to a known category, and to `null` when there is nothing to
 * show, so cards can hide the badge for incomplete profiles.
 */
export function getMembershipBadgeLabel(
  value: string | null | undefined,
  locale: MembersLocale,
) {
  const category = getMembershipCategory(value);

  if (!category) {
    const raw = value?.trim();
    return raw ? raw : null;
  }

  const config = membershipConfigById[category];
  if (locale === "ru") return config.shortTitleRu;
  if (locale === "uk") return config.shortTitleUk;
  return config.shortTitle;
}

/** Short, single-line bio excerpt for cards. */
export function getMemberBioExcerpt(text: string | null | undefined, maxLength = 120) {
  const value = text?.trim();
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength).trimEnd()}…`;
}

/**
 * Ranks members so the most complete profiles (photo + specialization + bio)
 * lead the featured homepage preview. Non-mutating.
 */
export function selectFeaturedMembers(members: PublicMember[], limit: number) {
  const score = (member: PublicMember) =>
    (member.avatarUrl ? 4 : 0) +
    ((member.specializations?.length ?? 0) > 0 ? 2 : 0) +
    (member.description ? 1 : 0);

  return [...members]
    .sort((a, b) => score(b) - score(a))
    .slice(0, Math.max(0, limit));
}
