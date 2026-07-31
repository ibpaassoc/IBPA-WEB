import { requestJson } from "../../shared/utils/admin-request";
import type {
  AdminTeamMember,
  AdminTeamMembersResponse,
} from "../types/admin-team.types";

type AdminTeamMemberWire = Omit<AdminTeamMember, "credentials"> & {
  credentials?: string | null;
  teamMemberId?: string | null;
};

type AdminTeamMembersWireResponse = Omit<AdminTeamMembersResponse, "items"> & {
  items: AdminTeamMemberWire[];
};

function storedTeamCredential(value: unknown) {
  return typeof value === "string" && value.startsWith("TEAM-") ? value : null;
}

export function normalizeAdminTeamMember(member: AdminTeamMemberWire): AdminTeamMember {
  const credentials =
    storedTeamCredential(member.credentials) ?? storedTeamCredential(member.teamMemberId);

  return {
    ...member,
    credentials,
  };
}

export async function getAdminTeamMembers(ownerOrderId: string, signal?: AbortSignal) {
  const response = await requestJson<AdminTeamMembersWireResponse>(
    `/api/admin/orders/${encodeURIComponent(ownerOrderId)}/team-members`,
    { cache: "no-store", signal },
    "Could not load team members.",
  );

  return {
    ...response,
    items: response.items.map(normalizeAdminTeamMember),
  };
}
