import type { Order, TeamMember, TeamSeatExtension } from "@/lib/schema";
import { upsertCanonicalTeam, upsertCanonicalTeamMember } from "./team.repository";

export async function syncLegacyTeam(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  order: Order;
  ownerUserId: string;
  seatExtensions: TeamSeatExtension[];
}) {
  const activeSeatExtensions = params.seatExtensions
    .filter((extension) => extension.status === "active")
    .reduce((sum, extension) => sum + Number(extension.seatsRequested || 0), 0);

  return upsertCanonicalTeam(db, {
    id: params.order.id,
    ownerUserId: params.ownerUserId,
    name: params.order.name,
    seatCount: 5 + activeSeatExtensions,
    createdAt: params.order.createdAt,
  });
}

export async function syncLegacyTeamMember(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  member: TeamMember;
  teamId: string;
}) {
  return upsertCanonicalTeamMember(db, {
    id: params.member.id,
    teamId: params.teamId,
    email: params.member.email,
    fullName: params.member.fullName,
    role: params.member.role,
    status: params.member.status,
    joinedAt: params.member.createdAt,
  });
}
