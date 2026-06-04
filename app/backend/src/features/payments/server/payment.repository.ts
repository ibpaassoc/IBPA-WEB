import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { corePayments, coreStripeWebhookEvents } from "@/lib/schema";

type DbClient = ReturnType<typeof requireDb>;

export async function upsertCanonicalPayment(db: DbClient, input: {
  id: string;
  userId?: string | null;
  type: string;
  stripeSessionId?: string | null;
  amount: number;
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  createdAt?: Date;
  paidAt?: Date | null;
}) {
  const [existing] = await db.select().from(corePayments).where(eq(corePayments.id, input.id)).limit(1);

  if (existing) {
    const [updated] = await db
      .update(corePayments)
      .set({
        userId: input.userId ?? existing.userId,
        type: input.type,
        stripeSessionId: input.stripeSessionId ?? existing.stripeSessionId,
        amount: input.amount,
        status: input.status,
        createdAt: input.createdAt ?? existing.createdAt,
        paidAt: input.paidAt ?? existing.paidAt,
      })
      .where(eq(corePayments.id, existing.id))
      .returning();

    return { record: updated ?? existing, created: false };
  }

  const [created] = await db
    .insert(corePayments)
    .values({
      id: input.id,
      userId: input.userId ?? null,
      type: input.type,
      stripeSessionId: input.stripeSessionId ?? null,
      amount: input.amount,
      status: input.status,
      createdAt: input.createdAt ?? new Date(),
      paidAt: input.paidAt ?? null,
    })
    .returning();

  return { record: created, created: true };
}

export async function upsertCanonicalStripeWebhookEvent(db: DbClient, input: {
  id: string;
  stripeEventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  processedAt?: Date | null;
}) {
  const [existing] = await db
    .select()
    .from(coreStripeWebhookEvents)
    .where(eq(coreStripeWebhookEvents.stripeEventId, input.stripeEventId))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(coreStripeWebhookEvents)
      .set({
        eventType: input.eventType,
        payload: input.payload,
        processedAt: input.processedAt ?? existing.processedAt,
      })
      .where(eq(coreStripeWebhookEvents.id, existing.id))
      .returning();

    return { record: updated ?? existing, created: false };
  }

  const [created] = await db
    .insert(coreStripeWebhookEvents)
    .values({
      id: input.id,
      stripeEventId: input.stripeEventId,
      eventType: input.eventType,
      payload: input.payload,
      processedAt: input.processedAt ?? null,
    })
    .returning();

  return { record: created, created: true };
}
