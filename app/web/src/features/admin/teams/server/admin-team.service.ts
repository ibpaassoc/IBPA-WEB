import type { AdminTeamMember } from "../types/admin-team.types";

/**
 * A removed seat keeps its card for auditing but must never be mailed. Mirrors
 * `isMailableTeamMemberStatus` on the backend, which filters the same rows out
 * of the mailing recipient projection.
 */
export function isMailableTeamMember(member: Pick<AdminTeamMember, "accessStatus">) {
  return String(member.accessStatus || "").trim().toLowerCase() !== "removed";
}
