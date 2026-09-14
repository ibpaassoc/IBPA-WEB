import {
  MEMBERSHIP_APPLICANT_TYPES,
  normalizeMembershipCategory,
  type MembershipCategory,
} from "@/features/memberships/server/membership-change";

export const webinarPublicationStatuses = ["DRAFT", "PUBLISHED"] as const;
export type WebinarPublicationStatus =
  (typeof webinarPublicationStatuses)[number];

export const webinarAudiences = [
  "ALL_MEMBERS",
  "INDIVIDUALS",
  "MEMBERSHIP_TYPES",
] as const;
export type WebinarAudience = (typeof webinarAudiences)[number];

/** Stored in `ibpa.webinars.access_settings` (JSONB). */
export type WebinarAccessSettings = {
  audience: WebinarAudience;
  /** Existing IBPA membership categories; used when audience is MEMBERSHIP_TYPES. */
  membershipTypes: MembershipCategory[];
  allowTeamMembers: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
};

export const membershipCategoryOptions = (
  Object.keys(MEMBERSHIP_APPLICANT_TYPES) as MembershipCategory[]
).map((category) => ({
  value: category,
  applicantType: MEMBERSHIP_APPLICANT_TYPES[category],
}));

export function isWebinarPublicationStatus(
  value: unknown,
): value is WebinarPublicationStatus {
  return webinarPublicationStatuses.includes(value as WebinarPublicationStatus);
}

function uniqueCategories(value: unknown) {
  if (!Array.isArray(value)) return [];
  const categories = value
    .map((item) => normalizeMembershipCategory(item))
    .filter((item): item is MembershipCategory => Boolean(item));
  return Array.from(new Set(categories));
}

export function defaultWebinarAccessSettings(): WebinarAccessSettings {
  return {
    audience: "ALL_MEMBERS",
    membershipTypes: [],
    allowTeamMembers: false,
    updatedAt: null,
    updatedBy: null,
  };
}

export function normalizeWebinarAccessSettings(
  raw: unknown,
): WebinarAccessSettings {
  const value =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const defaults = defaultWebinarAccessSettings();
  return {
    audience: webinarAudiences.includes(value.audience as WebinarAudience)
      ? (value.audience as WebinarAudience)
      : defaults.audience,
    membershipTypes: uniqueCategories(value.membershipTypes),
    allowTeamMembers: value.allowTeamMembers === true,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
    updatedBy: typeof value.updatedBy === "string" ? value.updatedBy : null,
  };
}
