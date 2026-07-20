ALTER TABLE "ibpa"."team_members"
  ADD COLUMN IF NOT EXISTS "credentials" varchar(60);

--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "ibpa_team_members_credentials_uidx"
  ON "ibpa"."team_members" USING btree ("credentials");

--> statement-breakpoint

COMMENT ON COLUMN "ibpa"."team_members"."credentials" IS
  'Team-member credential (format: TEAM-<teamNumber>-<YYYYMMDD>-<hex>) verified via the shared /verify-cert route.';
