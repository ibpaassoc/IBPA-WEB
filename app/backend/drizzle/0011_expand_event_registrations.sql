ALTER TABLE "ibpa"."event_registrations"
ADD COLUMN IF NOT EXISTS "email" varchar(255);

ALTER TABLE "ibpa"."event_registrations"
ADD COLUMN IF NOT EXISTS "source" varchar(80) DEFAULT 'dashboard' NOT NULL;

ALTER TABLE "ibpa"."event_registrations"
ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp;

ALTER TABLE "ibpa"."event_registrations"
ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;

ALTER TABLE "ibpa"."event_registrations"
ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

UPDATE "ibpa"."event_registrations" AS "registrations"
SET "email" = COALESCE("users"."email", '')
FROM "ibpa"."users" AS "users"
WHERE "registrations"."user_id" = "users"."id"
  AND ("registrations"."email" IS NULL OR "registrations"."email" = '');

UPDATE "ibpa"."event_registrations"
SET "email" = ''
WHERE "email" IS NULL;

ALTER TABLE "ibpa"."event_registrations"
ALTER COLUMN "email" SET DEFAULT '';

ALTER TABLE "ibpa"."event_registrations"
ALTER COLUMN "email" SET NOT NULL;
