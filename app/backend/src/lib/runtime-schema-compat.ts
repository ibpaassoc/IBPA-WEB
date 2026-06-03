import { sql } from "drizzle-orm";
import { isDbConfigured, requireDb } from "./db";

export async function ensureRuntimeSchemaCompat() {
  if (!isDbConfigured) {
    return;
  }

  const db = requireDb();

  await db.execute(sql`
    alter table "orders"
      add column if not exists "confirmation_email_status" varchar(30) default 'NOT_SENT' not null,
      add column if not exists "email_sent_at" timestamp,
      add column if not exists "email_error" text
  `);

  await db.execute(sql`
    alter table "partner_applications"
      add column if not exists "confirmation_email_status" varchar(30) default 'NOT_SENT' not null,
      add column if not exists "email_sent_at" timestamp,
      add column if not exists "email_error" text
  `);

  await db.execute(sql`
    create table if not exists "stripe_webhook_events" (
      "id" uuid primary key default gen_random_uuid() not null,
      "event_id" text not null,
      "event_type" varchar(120) not null,
      "livemode" boolean default false not null,
      "processed_at" timestamp default now() not null,
      "created_at" timestamp default now() not null,
      constraint "stripe_webhook_events_event_id_unique" unique("event_id")
    )
  `);

  await db.execute(sql`
    create index if not exists "stripe_webhook_events_event_id_idx"
      on "stripe_webhook_events" using btree ("event_id")
  `);

  await db.execute(sql`
    alter table "team_members"
      add column if not exists "avatar_url" text,
      add column if not exists "bio" text,
      add column if not exists "location" varchar(255),
      add column if not exists "joined_at" timestamp
  `);
}
