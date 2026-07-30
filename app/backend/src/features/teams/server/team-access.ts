export const INCLUDED_TEAM_SEATS = 5;

export type TeamOwnerKind = "partner" | "business";

export type TeamDashboardAccessType =
  | "member"
  | "partner_owner"
  | "business_owner"
  | "partner_team_member"
  | "business_team_member";

function normalizeCategory(value: unknown) {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/[\s_-]+/g, "")
    : "";
}

export function isBusinessOwnerMembershipType(value: unknown) {
  const normalized = normalizeCategory(value);
  return (
    normalized === "business" ||
    normalized === "businessmembership" ||
    normalized === "businessowner" ||
    normalized === "businessowners" ||
    normalized === "businessownermembership"
  );
}

export function resolveTeamOwnerKind(input: {
  role?: unknown;
  applicationType?: unknown;
  packageName?: unknown;
  membershipType?: unknown;
  hasTeam?: boolean;
}): TeamOwnerKind | null {
  const role = normalizeCategory(input.role);
  const applicationType = normalizeCategory(input.applicationType);

  if (role === "partner" || applicationType === "partner") {
    return "partner";
  }

  if (
    isBusinessOwnerMembershipType(input.packageName) ||
    isBusinessOwnerMembershipType(input.membershipType)
  ) {
    return "business";
  }

  // Preserve access for legacy partner teams whose source classification is
  // incomplete. Business Owner records are identified above before this fallback.
  return input.hasTeam ? "partner" : null;
}

export function getTeamOwnerAccessType(
  ownerKind: TeamOwnerKind | null,
): TeamDashboardAccessType {
  if (ownerKind === "partner") return "partner_owner";
  if (ownerKind === "business") return "business_owner";
  return "member";
}

export function getTeamMemberAccessType(
  ownerKind: TeamOwnerKind | null,
): TeamDashboardAccessType {
  return ownerKind === "business"
    ? "business_team_member"
    : "partner_team_member";
}

export function isTeamOwnerAccess(
  accessType: TeamDashboardAccessType,
) {
  return accessType === "partner_owner" || accessType === "business_owner";
}

export function isTeamMemberAccess(
  accessType: TeamDashboardAccessType,
) {
  return (
    accessType === "partner_team_member" ||
    accessType === "business_team_member"
  );
}

export function getTeamAccountType(ownerKind: TeamOwnerKind | null) {
  return ownerKind === "partner" ? "partner" : "member";
}
