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

/** Any non-empty stored credential is shown as-is, whatever its format. */
function storedCredential(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * `teamMemberId` is a derived seat label (IBPA-BO-003-T01) in some payloads, so
 * it is only trusted when it carries a real TEAM- credential.
 */
function credentialFromLegacyKey(value: unknown) {
  const stored = storedCredential(value);
  return stored?.toUpperCase().startsWith("TEAM-") ? stored : null;
}

export function normalizeAdminTeamMember(member: AdminTeamMemberWire): AdminTeamMember {
  const credentials =
    storedCredential(member.credentials) ?? credentialFromLegacyKey(member.teamMemberId);

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
