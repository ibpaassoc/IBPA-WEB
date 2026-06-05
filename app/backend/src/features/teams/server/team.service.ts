import type { SourceOrderRecord, SourceTeamMemberRecord } from "@/features/shared/server/source-records";
import { findCanonicalTeam, updateCanonicalTeamSeatCount, upsertCanonicalTeam, upsertCanonicalTeamMember } from "./team.repository";

export async function importSourceTeam(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  order: SourceOrderRecord;
  ownerUserId: string;
  seatCount?: number;
}) {
  const existing = await findCanonicalTeam(db, params.order.id);

  return upsertCanonicalTeam(db, {
    id: params.order.id,
    ownerUserId: params.ownerUserId,
    name: params.order.name,
    seatCount: params.seatCount ?? existing?.seatCount ?? 5,
    createdAt: params.order.createdAt,
  });
}

export async function importSourceTeamMember(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  member: SourceTeamMemberRecord;
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

export async function extendCanonicalTeamSeats(db: ReturnType<typeof import("@/lib/db").requireDb>, params: {
  teamId: string;
  seatsRequested: number;
}) {
  const existing = await findCanonicalTeam(db, params.teamId);
  if (!existing) {
    throw new Error("Team not found.");
  }

  const nextSeatCount = existing.seatCount + params.seatsRequested;
  return updateCanonicalTeamSeatCount(db, {
    id: params.teamId,
    seatCount: nextSeatCount,
  });
}
