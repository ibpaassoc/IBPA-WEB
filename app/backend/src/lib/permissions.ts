export const USER_ROLES = ["ADMIN", "MEMBER", "PARTNER", "TEAM_MEMBER"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function canManageTeams(role: UserRole | null | undefined) {
  return role === "ADMIN" || role === "PARTNER";
}

export function canManageContent(role: UserRole | null | undefined) {
  return role === "ADMIN";
}

export function canReceiveMemberNotifications(role: UserRole | null | undefined) {
  return role === "ADMIN" || role === "MEMBER" || role === "PARTNER" || role === "TEAM_MEMBER";
}
