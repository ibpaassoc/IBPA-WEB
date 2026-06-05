import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { coreMemberships } from "@/lib/schema";
import type { CanonicalMembershipInput } from "./membership.types";

type DbClient = ReturnType<typeof requireDb>;

export async function upsertCanonicalMembership(db: DbClient, input: CanonicalMembershipInput) {
  const [existing] = await db.select().from(coreMemberships).where(eq(coreMemberships.id, input.id)).limit(1);

  if (existing) {
    const [updated] = await db
      .update(coreMemberships)
      .set({
        userId: input.userId,
        type: input.type,
        status: input.status,
        startedAt: input.startedAt ?? existing.startedAt,
        expiresAt: input.expiresAt ?? existing.expiresAt,
      })
      .where(eq(coreMemberships.id, existing.id))
      .returning();

    return { record: updated ?? existing, created: false };
  }

  const [created] = await db
    .insert(coreMemberships)
    .values({
      id: input.id,
      userId: input.userId,
      type: input.type,
      status: input.status,
      startedAt: input.startedAt ?? null,
      expiresAt: input.expiresAt ?? null,
    })
    .returning();

  return { record: created, created: true };
}
