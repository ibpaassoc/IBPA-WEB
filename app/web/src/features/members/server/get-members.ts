import "server-only";

import { getPublicMembers } from "@/lib/public-members";
import type { MembersLocale, PublicMember } from "../types";
import { selectFeaturedMembers } from "../utils";

/**
 * All public members for the `/members` directory. Backed by the existing
 * `/api/members/public` endpoint, which only returns ACTIVE (paid/approved)
 * memberships and public-safe fields.
 */
export async function getAllPublicMembers(
  locale: MembersLocale = "en",
): Promise<PublicMember[]> {
  return getPublicMembers(locale);
}

/**
 * A small, most-complete subset of members for the homepage preview section.
 */
export async function getFeaturedMembers(
  locale: MembersLocale = "en",
  limit = 8,
): Promise<PublicMember[]> {
  const members = await getPublicMembers(locale);
  return selectFeaturedMembers(members, limit);
}
