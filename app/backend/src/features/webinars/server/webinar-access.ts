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

export type WebinarAccessValidation =
  | { ok: true; value: Omit<WebinarAccessSettings, "updatedAt" | "updatedBy"> }
  | { ok: false; error: string };

/** Strict validation for admin input; unlike normalization it never guesses. */
export function validateWebinarAccessInput(raw: unknown): WebinarAccessValidation {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "Access settings are required." };
  }
  const value = raw as Record<string, unknown>;
  if (!webinarAudiences.includes(value.audience as WebinarAudience)) {
    return {
      ok: false,
      error: "Choose who can watch: all members, individuals only, or specific membership types.",
    };
  }
  if (typeof value.allowTeamMembers !== "boolean") {
    return { ok: false, error: "Choose whether team members can watch." };
  }
  const audience = value.audience as WebinarAudience;
  const requested = Array.isArray(value.membershipTypes) ? value.membershipTypes : [];
  const membershipTypes = uniqueCategories(requested);
  if (audience === "MEMBERSHIP_TYPES") {
    if (!membershipTypes.length || membershipTypes.length !== requested.length) {
      return {
        ok: false,
        error: "Select at least one valid membership type.",
      };
    }
  }
  return {
    ok: true,
    value: {
      audience,
      membershipTypes: audience === "MEMBERSHIP_TYPES" ? membershipTypes : [],
      allowTeamMembers: value.allowTeamMembers,
    },
  };
}

export type WebinarViewer = {
  /** Team members watch through the account (Business or partner) that invited them. */
  kind: "owner" | "team_member";
  /** Active membership type granting dashboard access; the owner's for team members. */
  membershipType: string | null;
};

/**
 * Single source of truth for member webinar access. Drafts are never visible;
 * team members need the explicit toggle and an eligible owning account.
 */
export function canViewerWatchWebinar(input: {
  publicationStatus: string;
  access: WebinarAccessSettings;
  viewer: WebinarViewer;
}) {
  if (input.publicationStatus !== "PUBLISHED") return false;
  const { access, viewer } = input;
  if (viewer.kind === "team_member" && !access.allowTeamMembers) return false;

  const category = normalizeMembershipCategory(viewer.membershipType);
  switch (access.audience) {
    case "ALL_MEMBERS":
      return true;
    case "INDIVIDUALS":
      return Boolean(category && MEMBERSHIP_APPLICANT_TYPES[category] === "Individual");
    case "MEMBERSHIP_TYPES":
      return Boolean(category && access.membershipTypes.includes(category));
    default:
      return false;
  }
}
