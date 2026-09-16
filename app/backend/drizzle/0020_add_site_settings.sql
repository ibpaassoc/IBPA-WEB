-- Additive only. Generic key/value store for administrator-owned site
-- configuration: promo codes, references to integration keys (names only,
-- never secret values), and other general data. One row per settings key.
CREATE TABLE IF NOT EXISTS "ibpa"."site_settings" (
  "key" varchar(120) PRIMARY KEY NOT NULL,
  "value" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "description" text,
  "updated_by" varchar(255),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
