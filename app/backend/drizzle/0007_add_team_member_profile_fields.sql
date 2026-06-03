ALTER TABLE "team_members"
  ADD COLUMN IF NOT EXISTS "avatar_url" text,
  ADD COLUMN IF NOT EXISTS "bio" text,
  ADD COLUMN IF NOT EXISTS "location" varchar(255),
  ADD COLUMN IF NOT EXISTS "joined_at" timestamp;
