import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreTeamMembers, coreTeams } from "@/lib/schema";

type DbClient = ReturnType<typeof requireDb>;

export async function upsertCanonicalTeam(db: DbClient, input: {
  id: string;
  ownerUserId: string;
  name: string;
  seatCount: number;
  createdAt?: Date;
}) {
  const [existing] = await db.select().from(coreTeams).where(eq(coreTeams.id, input.id)).limit(1);

  if (existing) {
    const [updated] = await db
      .update(coreTeams)
      .set({
        ownerUserId: input.ownerUserId,
        name: input.name,
        seatCount: input.seatCount,
        createdAt: input.createdAt ?? existing.createdAt,
      })
      .where(eq(coreTeams.id, existing.id))
      .returning();

    return { record: updated ?? existing, created: false };
  }

  const [created] = await db
    .insert(coreTeams)
    .values({
      id: input.id,
      ownerUserId: input.ownerUserId,
      name: input.name,
      seatCount: input.seatCount,
      createdAt: input.createdAt ?? new Date(),
    })
    .returning();

  return { record: created, created: true };
}

export async function findCanonicalTeam(db: DbClient, id: string) {
  const [record] = await db.select().from(coreTeams).where(eq(coreTeams.id, id)).limit(1);
  return record ?? null;
}

export async function updateCanonicalTeamSeatCount(db: DbClient, params: {
  id: string;
  seatCount: number;
}) {
  const [updated] = await db
    .update(coreTeams)
    .set({
      seatCount: params.seatCount,
    })
    .where(eq(coreTeams.id, params.id))
    .returning();

  return updated ?? null;
}

export async function upsertCanonicalTeamMember(db: DbClient, input: {
  id: string;
  teamId: string;
  email: string;
  fullName: string;
  role?: string | null;
  status: string;
  joinedAt?: Date | null;
}) {
  const [existing] = await db.select().from(coreTeamMembers).where(eq(coreTeamMembers.id, input.id)).limit(1);

  if (existing) {
    const [updated] = await db
      .update(coreTeamMembers)
      .set({
        teamId: input.teamId,
        email: input.email,
        fullName: input.fullName,
        role: input.role ?? existing.role,
        status: input.status,
        joinedAt: input.joinedAt ?? existing.joinedAt,
      })
      .where(eq(coreTeamMembers.id, existing.id))
      .returning();

    return { record: updated ?? existing, created: false };
  }

  const [created] = await db
    .insert(coreTeamMembers)
    .values({
      id: input.id,
      teamId: input.teamId,
      email: input.email,
      fullName: input.fullName,
      role: input.role ?? null,
      status: input.status,
      joinedAt: input.joinedAt ?? null,
    })
    .returning();

  return { record: created, created: true };
}
