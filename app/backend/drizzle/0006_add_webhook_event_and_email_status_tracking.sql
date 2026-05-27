ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "confirmation_email_status" varchar(30) DEFAULT 'NOT_SENT' NOT NULL,
  ADD COLUMN IF NOT EXISTS "email_sent_at" timestamp,
  ADD COLUMN IF NOT EXISTS "email_error" text;

ALTER TABLE "partner_applications"
  ADD COLUMN IF NOT EXISTS "confirmation_email_status" varchar(30) DEFAULT 'NOT_SENT' NOT NULL,
  ADD COLUMN IF NOT EXISTS "email_sent_at" timestamp,
  ADD COLUMN IF NOT EXISTS "email_error" text;

CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" text NOT NULL,
  "event_type" varchar(120) NOT NULL,
  "livemode" boolean DEFAULT false NOT NULL,
  "processed_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "stripe_webhook_events_event_id_unique" UNIQUE("event_id")
);

CREATE INDEX IF NOT EXISTS "stripe_webhook_events_event_id_idx"
  ON "stripe_webhook_events" USING btree ("event_id");
