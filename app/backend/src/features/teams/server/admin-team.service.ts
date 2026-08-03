import { eq } from "drizzle-orm";

import { requireDb } from "@/lib/db";
import { coreApplications, coreTeams } from "@/lib/schema";
import { INCLUDED_TEAM_SEATS, resolveTeamOwnerKind } from "./team-access";
import {
  ensureCanonicalTeamMemberCredential,
  listCanonicalTeamMembers,
} from "./team.repository";

type DbClient = ReturnType<typeof requireDb>;
type TeamMember = Awaited<ReturnType<typeof listCanonicalTeamMembers>>[number];

export type AdminTeamMemberStatus = "active" | "inactive" | "invited" | "removed" | string;

export type AdminTeamMembersResponse = {
  ownerOrderId: string;
  ownerType: "business" | "partner";
  ownerName: string;
  seatCount: number;
  count: number;
  activeCount: number;
  items: Array<{
    id: string;
    credentials: string | null;
    avatarUrl: string | null;
    fullName: string;
    email: string;
    role: string;
    status: AdminTeamMemberStatus;
    seatNumber: number;
    seatType: "included" | "additional";
    accessStatus: AdminTeamMemberStatus;
    registrationStatus: string;
    joinedAt: Date | null;
  }>;
};

export type AdminTeamLookupResult =
  | { ok: true; data: AdminTeamMembersResponse }
  | { ok: false; reason: "not_found" | "unsupported_owner" };

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function normalizeMemberStatus(value: string): AdminTeamMemberStatus {
  const normalized = value.trim().toLowerCase();
  return normalized || "inactive";
}

/**
 * A removed seat keeps its row for auditing but must never be mailed. Every
 * other state (invited, inactive, active) still belongs to the account.
 */
export function isMailableTeamMemberStatus(value: unknown) {
  return normalizeMemberStatus(typeof value === "string" ? value : "") !== "removed";
}

/**
 * Groups mailable team member emails by team id. Team ids are the owner order
 * ids, so the result maps straight onto a membership/order row.
 */
export function buildTeamEmailIndex(
  members: Array<{ teamId: string; email: string; status: string }>,
) {
  const byTeam = new Map<string, string[]>();

  for (const member of members) {
    if (!isMailableTeamMemberStatus(member.status)) continue;

    const email = String(member.email || "").trim().toLowerCase();
    if (!email) continue;

    const emails = byTeam.get(member.teamId) ?? [];
    if (!emails.includes(email)) {
      emails.push(email);
    }
    byTeam.set(member.teamId, emails);
  }

  return byTeam;
}

export function mapAdminTeamMemberRecords(
  members: TeamMember[],
) {
  const activeMembers = members.filter(
    (member) => normalizeMemberStatus(member.status) !== "removed",
  );

  return members.map((member, index) => {
    const status = normalizeMemberStatus(member.status);
    const activeIndex = activeMembers.findIndex((active) => active.id === member.id);
    const seatNumber = activeIndex >= 0 ? activeIndex + 1 : index + 1;
    const seatType: "included" | "additional" =
      seatNumber <= INCLUDED_TEAM_SEATS ? "included" : "additional";

    return {
      id: member.id,
      credentials: member.credentials,
      avatarUrl: null,
      fullName: member.fullName,
      email: member.email,
      role: member.role || "",
      status,
      seatNumber,
      seatType,
      accessStatus: status,
      registrationStatus: status === "active" ? "registered" : "not_registered",
      joinedAt: member.joinedAt,
    };
  });
}

export async function listAdminTeamMembersByOwnerOrder(
  db: DbClient,
  ownerOrderId: string,
): Promise<AdminTeamLookupResult> {
  const [application] = await db
    .select()
    .from(coreApplications)
    .where(eq(coreApplications.id, ownerOrderId))
    .limit(1);

  if (!application) {
    return { ok: false, reason: "not_found" };
  }

  const [team] = await db
    .select()
    .from(coreTeams)
    .where(eq(coreTeams.id, ownerOrderId))
    .limit(1);

  // `hasTeam` mirrors the dashboard resolution: an owner that actually has a
  // team record stays visible to admins even when its source classification is
  // incomplete (legacy partner imports), instead of failing as unsupported.
  const ownerType = resolveTeamOwnerKind({
    applicationType: application.type,
    packageName: application.packageName,
    hasTeam: Boolean(team),
  });
  if (!ownerType) {
    return { ok: false, reason: "unsupported_owner" };
  }

  if (!team) {
    return {
      ok: true,
      data: {
        ownerOrderId,
        ownerType,
        ownerName: application.fullName,
        seatCount: 0,
        count: 0,
        activeCount: 0,
        items: [],
      },
    };
  }

  const storedMembers = await listCanonicalTeamMembers(db, team.id);
  // Mint a credential for any member that never got one, exactly as the owner
  // dashboard does on read. Without this an admin sees "Not assigned" for
  // members whose owner has not opened the dashboard since the credential
  // column was introduced.
  const members = await Promise.all(
    storedMembers.map((member: TeamMember) => ensureCanonicalTeamMemberCredential(db, member)),
  );
  const items = mapAdminTeamMemberRecords(members);

  return {
    ok: true,
    data: {
      ownerOrderId,
      ownerType,
      ownerName: team.name || application.fullName,
      seatCount: team.seatCount,
      count: items.length,
      activeCount: items.filter((item) => item.accessStatus === "active").length,
      items,
    },
  };
}
