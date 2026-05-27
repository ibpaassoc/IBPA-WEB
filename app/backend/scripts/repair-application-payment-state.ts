import "../src/load-env";
import { requireDb } from "../src/lib/db";
import { sql } from "drizzle-orm";

const dashboardActivationSubject = "Complete your IBPA dashboard access";

function getResultRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) {
    return result as T[];
  }

  if (result && typeof result === "object" && "rows" in result && Array.isArray((result as any).rows)) {
    return (result as any).rows as T[];
  }

  return [];
}

async function main() {
  const db = requireDb();

  const updatedPaidPartnerStatuses = await db.execute(sql`
    update partner_applications
    set status = 'SUBMITTED',
        updated_at = now()
    where upper(coalesce(payment_status, '')) = 'PAID'
      and upper(coalesce(status, '')) <> 'SUBMITTED'
    returning id
  `);

  const backfilledOrderEmails = await db.execute(sql`
    update orders o
    set confirmation_email_status = 'SENT',
        email_error = null,
        email_sent_at = coalesce(o.email_sent_at, l.created_at)
    from email_logs l
    where lower(l."to") = lower(o.email)
      and l.subject = ${dashboardActivationSubject}
      and l.body = ('stripe-dashboard-activation:' || o.id::text)
      and l.status = 'sent'
      and coalesce(o.confirmation_email_status, 'NOT_SENT') <> 'SENT'
    returning o.id
  `);

  const backfilledPartnerEmails = await db.execute(sql`
    update partner_applications p
    set confirmation_email_status = 'SENT',
        email_error = null,
        email_sent_at = coalesce(p.email_sent_at, l.created_at),
        updated_at = now()
    from email_logs l
    where p.partner_order_id is not null
      and lower(l."to") = lower(p.email)
      and l.subject = ${dashboardActivationSubject}
      and l.body = ('stripe-dashboard-activation:' || p.partner_order_id::text)
      and l.status = 'sent'
      and coalesce(p.confirmation_email_status, 'NOT_SENT') <> 'SENT'
    returning p.id
  `);

  console.log("[Repair] Partner applications moved to SUBMITTED:", getResultRows(updatedPaidPartnerStatuses).length);
  console.log("[Repair] Orders email status backfilled:", getResultRows(backfilledOrderEmails).length);
  console.log("[Repair] Partner applications email status backfilled:", getResultRows(backfilledPartnerEmails).length);
}

main().catch((error) => {
  console.error("[Repair] Failed to repair payment/application state", error);
  process.exit(1);
});
