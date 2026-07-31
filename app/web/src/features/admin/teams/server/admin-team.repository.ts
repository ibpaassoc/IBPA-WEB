import { requestJson } from "../../shared/utils/admin-request";
import type { AdminTeamMembersResponse } from "../types/admin-team.types";

export function getAdminTeamMembers(ownerOrderId: string, signal?: AbortSignal) {
  return requestJson<AdminTeamMembersResponse>(
    `/api/admin/orders/${encodeURIComponent(ownerOrderId)}/team-members`,
    { cache: "no-store", signal },
    "Could not load team members.",
  );
}
