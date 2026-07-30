import { asc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreTeamMembers, coreTeams } from "@/lib/schema";
import { generateTeamMemberCredential } from "./team-credential";

type DbClient = ReturnType<typeof requireDb>;

export async function upsertCanonicalTeam(db: DbClient, input: {
  id: string;
  ownerUserId: string;
  name: string;
  seatCount: number;
  createdAt?: Date;
}) {
  const [existing] = await db.select().from(coreTeams).where(eq(coreTeams.id, input.id)).limit(1);
  const createdAt = input.createdAt ?? existing?.createdAt ?? new Date();
  const [record] = await db
    .insert(coreTeams)
    .values({
      id: input.id,
      ownerUserId: input.ownerUserId,
      name: input.name,
      seatCount: input.seatCount,
      createdAt,
    })
    .onConflictDoUpdate({
      target: coreTeams.id,
      set: {
        ownerUserId: input.ownerUserId,
        name: input.name,
        seatCount: input.seatCount,
        createdAt,
      },
    })
    .returning();

  return {
    record: record ?? existing!,
    created: !existing,
  };
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
  credentials?: string | null;
  joinedAt?: Date | null;
}) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const [existing] = await db.select().from(coreTeamMembers).where(eq(coreTeamMembers.id, input.id)).limit(1);

  if (existing) {
    const [updated] = await db
      .update(coreTeamMembers)
      .set({
        teamId: input.teamId,
        email: normalizedEmail,
        fullName: input.fullName,
        role: input.role ?? existing.role,
        status: input.status,
        // Preserve an existing credential unless a new one is explicitly supplied.
        credentials: input.credentials ?? existing.credentials,
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
      email: normalizedEmail,
      fullName: input.fullName,
      role: input.role ?? null,
      status: input.status,
      credentials: input.credentials ?? null,
      joinedAt: input.joinedAt ?? null,
    })
    .returning();

  return { record: created, created: true };
}

/**
 * Sequential 1-based position of a team ordered by creation, matching the
 * IBPA-BO-### owner-id scheme used across the dashboard. This is the "team number"
 * embedded in team-member credentials (TEAM-<teamNumber>-...).
 */
export async function getTeamSequentialNumber(db: DbClient, teamId: string): Promise<number> {
  const teams = await db
    .select({ id: coreTeams.id })
    .from(coreTeams)
    .orderBy(asc(coreTeams.createdAt), asc(coreTeams.id));

  const index = teams.findIndex((record: { id: string }) => record.id === teamId);
  return index >= 0 ? index + 1 : teams.length + 1;
}

/**
 * Generate a team-member credential guaranteed unique against existing rows.
 * Collisions are astronomically unlikely (they require the same team number,
 * date, and 16-bit hash), but we still verify and retry to respect the unique index.
 */
export async function generateUniqueTeamMemberCredential(
  db: DbClient,
  params: { teamNumber: number; date?: Date },
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = generateTeamMemberCredential({ teamNumber: params.teamNumber, date: params.date });
    const [clash] = await db
      .select({ id: coreTeamMembers.id })
      .from(coreTeamMembers)
      .where(eq(coreTeamMembers.credentials, candidate))
      .limit(1);
    if (!clash) {
      return candidate;
    }
  }
  throw new Error("Unable to generate a unique team-member credential after multiple attempts.");
}

export async function ensureCanonicalTeamMemberCredential(
  db: DbClient,
  member: typeof coreTeamMembers.$inferSelect,
) {
  if (member.credentials) {
    return member;
  }

  const teamNumber = await getTeamSequentialNumber(db, member.teamId);
  const credentials = await generateUniqueTeamMemberCredential(db, {
    teamNumber,
    date: member.joinedAt ?? new Date(),
  });
  const [updated] = await db
    .update(coreTeamMembers)
    .set({ credentials })
    .where(eq(coreTeamMembers.id, member.id))
    .returning();

  return updated ?? { ...member, credentials };
}
