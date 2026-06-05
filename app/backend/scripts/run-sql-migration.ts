import "dotenv/config";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { sql } from "drizzle-orm";
import * as dbModule from "../src/lib/db";

type JournalEntry = {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
};

function getRequireDb() {
  return (
    (dbModule as { requireDb?: unknown }).requireDb ??
    (dbModule as { default?: { requireDb?: unknown } }).default?.requireDb ??
    (dbModule as { "module.exports"?: { requireDb?: unknown } })["module.exports"]?.requireDb
  ) as (() => ReturnType<typeof dbModule.requireDb>);
}

async function main() {
  const tag = process.argv[2];

  if (!tag) {
    throw new Error("Missing migration tag. Usage: tsx scripts/run-sql-migration.ts <migration-tag>");
  }

  const journalPath = path.resolve(process.cwd(), "drizzle", "meta", "_journal.json");
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8")) as { entries: JournalEntry[] };
  const entry = journal.entries.find((candidate) => candidate.tag === tag);

  if (!entry) {
    throw new Error(`Migration tag not found in journal: ${tag}`);
  }

  const sqlPath = path.resolve(process.cwd(), "drizzle", `${tag}.sql`);
  const migrationSql = fs.readFileSync(sqlPath, "utf8");
  const migrationHash = crypto.createHash("sha256").update(migrationSql).digest("hex");
  const statements = migrationSql
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);

  const requireDb = getRequireDb();
  const db = requireDb();
  await db.execute(sql`create schema if not exists drizzle;`);
  await db.execute(sql`
    create table if not exists drizzle.__drizzle_migrations (
      id serial primary key,
      hash text not null,
      created_at bigint not null
    );
  `);

  const existing = await db.execute(sql`
    select id
    from drizzle.__drizzle_migrations
    where hash = ${migrationHash}
       or created_at = ${String(entry.when)}
    limit 1
  `);

  if (existing.rows.length > 0) {
    console.log(`[Migration] ${tag} already applied.`);
    return;
  }

  for (const statement of statements) {
    await db.execute(sql.raw(statement));
  }

  await db.execute(sql`
    insert into drizzle.__drizzle_migrations (hash, created_at)
    values (${migrationHash}, ${String(entry.when)})
  `);

  console.log(`[Migration] Applied ${tag}.`);
}

main().catch((error) => {
  console.error("[Migration] Failed:", error);
  process.exit(1);
});
