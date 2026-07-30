import type { DashboardAccessType } from "@/components/dashboard/dashboard-types";

const DASHBOARD_ACCESS_TYPES = new Set<DashboardAccessType>([
  "member",
  "partner_owner",
  "business_owner",
  "partner_team_member",
  "business_team_member",
]);

export function isDashboardAccessType(
  value: unknown,
): value is DashboardAccessType {
  return (
    typeof value === "string" &&
    DASHBOARD_ACCESS_TYPES.has(value as DashboardAccessType)
  );
}

export function isTeamOwnerDashboard(
  accessType: DashboardAccessType | null | undefined,
) {
  return accessType === "partner_owner" || accessType === "business_owner";
}

export function isTeamMemberDashboard(
  accessType: DashboardAccessType | null | undefined,
) {
  return (
    accessType === "partner_team_member" ||
    accessType === "business_team_member"
  );
}

export function isPartnerOwnerDashboard(
  accessType: DashboardAccessType | null | undefined,
) {
  return accessType === "partner_owner";
}
