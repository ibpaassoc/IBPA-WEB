import "dotenv/config";
import { sql } from "drizzle-orm";
import * as dbModule from "../src/lib/db";

const droppedPublicTables = new Set([
  "users",
  "orders",
  "certificates",
  "content_items",
  "dashboard_notifications",
  "email_logs",
  "team_members",
  "team_seat_extensions",
  "partner_applications",
  "application_additional_files",
  "stripe_webhook_events",
  "card_requests",
]);

const requiredCanonicalTables = new Set([
  "users",
  "profiles",
  "applications",
  "memberships",
  "payments",
  "certificates",
  "events",
  "event_registrations",
  "articles",
  "notifications",
  "teams",
  "team_members",
  "files",
  "stripe_webhook_events",
  "partners",
]);

function getRequireDb() {
  return (
    (dbModule as { requireDb?: unknown }).requireDb ??
    (dbModule as { default?: { requireDb?: unknown } }).default?.requireDb ??
    (dbModule as { "module.exports"?: { requireDb?: unknown } })["module.exports"]?.requireDb
  ) as (() => ReturnType<typeof dbModule.requireDb>);
}

async function main() {
  const requireDb = getRequireDb();
  const db = requireDb();
  const publicRows = await db.execute(sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
    order by table_name
  `);
  const ibpaRows = await db.execute(sql`
    select table_name
    from information_schema.tables
    where table_schema = 'ibpa'
    order by table_name
  `);

  const leftoverPublicTables = publicRows.rows
    .map((row: { table_name: unknown }) => String(row.table_name))
    .filter((tableName: string) => droppedPublicTables.has(tableName));
  const canonicalTables = new Set(ibpaRows.rows.map((row: { table_name: unknown }) => String(row.table_name)));
  const missingCanonicalTables = Array.from(requiredCanonicalTables).filter((tableName) => !canonicalTables.has(tableName));

  console.log(JSON.stringify({
    leftoverPublicTables,
    missingCanonicalTables,
    canonicalTables: Array.from(canonicalTables).sort(),
  }, null, 2));

  if (leftoverPublicTables.length > 0 || missingCanonicalTables.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("[Verify cutover] Failed:", error);
  process.exit(1);
});
