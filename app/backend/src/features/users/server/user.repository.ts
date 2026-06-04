import { eq, or } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreUsers } from "@/lib/schema";

type DbClient = ReturnType<typeof requireDb>;

export async function findCanonicalUserByClerkId(db: DbClient, clerkId: string) {
  const [record] = await db.select().from(coreUsers).where(eq(coreUsers.clerkId, clerkId)).limit(1);
  return record ?? null;
}

export async function findCanonicalUserByEmail(db: DbClient, email: string) {
  const [record] = await db.select().from(coreUsers).where(eq(coreUsers.email, email)).limit(1);
  return record ?? null;
}

export async function findCanonicalUser(db: DbClient, params: { clerkId?: string | null; email: string }) {
  const conditions = [];

  if (params.clerkId) {
    conditions.push(eq(coreUsers.clerkId, params.clerkId));
  }

  conditions.push(eq(coreUsers.email, params.email));

  const [record] = await db.select().from(coreUsers).where(or(...conditions)).limit(1);
  return record ?? null;
}

export async function upsertCanonicalUser(db: DbClient, params: {
  id?: string;
  clerkId?: string | null;
  email: string;
  role: "ADMIN" | "MEMBER" | "PARTNER" | "TEAM_MEMBER";
  status: string;
}) {
  const existing = await findCanonicalUser(db, {
    clerkId: params.clerkId,
    email: params.email,
  });

  if (existing) {
    const [updated] = await db
      .update(coreUsers)
      .set({
        clerkId: params.clerkId ?? existing.clerkId,
        email: params.email,
        role: params.role,
        status: params.status,
      })
      .where(eq(coreUsers.id, existing.id))
      .returning();

    return { record: updated ?? existing, created: false };
  }

  const [created] = await db
    .insert(coreUsers)
    .values({
      ...(params.id ? { id: params.id } : {}),
      clerkId: params.clerkId ?? null,
      email: params.email,
      role: params.role,
      status: params.status,
    })
    .returning();

  return { record: created, created: true };
}
