import { sql } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { describePromoCodeDiscount, listPromoCodes } from "./promo-code.service";
import type { AdminPromoCode } from "./promo-code.types";

type DbClient = ReturnType<typeof requireDb>;

type UsageRow = {
  code: string | null;
  total: number | string | null;
  paid: number | string | null;
};

function asCount(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** How many applications carry each promo code, and how many of those paid. */
async function readPromoCodeUsage(db: DbClient) {
  const result = await db.execute(sql`
    select
      upper(application_data ->> 'promoCode') as code,
      count(*) as total,
      count(*) filter (where status = 'PAID') as paid
    from "ibpa"."applications"
    where type = 'MEMBER'
      and coalesce(application_data ->> 'promoCode', '') <> ''
    group by 1
  `);

  const usage = new Map<string, { total: number; paid: number }>();
  for (const row of (result?.rows ?? []) as UsageRow[]) {
    if (!row.code) continue;
    usage.set(row.code, { total: asCount(row.total), paid: asCount(row.paid) });
  }

  return usage;
}

export async function listAdminPromoCodes(db: DbClient): Promise<AdminPromoCode[]> {
  const [items, usage] = await Promise.all([listPromoCodes(db), readPromoCodeUsage(db)]);

  return Promise.all(
    items.map(async (item) => {
      const counts = usage.get(item.code) ?? { total: 0, paid: 0 };
      const discount = await describePromoCodeDiscount(item);
      return {
        ...item,
        applicationCount: counts.total,
        discountConfigured: discount.status === "linked",
        discountMessage: discount.message,
        discountStatus: discount.status,
        paidCount: counts.paid,
      };
    }),
  );
}
