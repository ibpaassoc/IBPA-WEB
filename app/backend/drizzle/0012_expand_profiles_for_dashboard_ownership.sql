ALTER TABLE "ibpa"."profiles"
ADD COLUMN IF NOT EXISTS "phone" varchar(80);

--> statement-breakpoint

ALTER TABLE "ibpa"."profiles"
ADD COLUMN IF NOT EXISTS "achievements" text;

--> statement-breakpoint

ALTER TABLE "ibpa"."profiles"
ADD COLUMN IF NOT EXISTS "industry_contribution" text;

--> statement-breakpoint

WITH latest_applications AS (
  SELECT DISTINCT ON ("applications"."user_id")
    "applications"."user_id",
    NULLIF(BTRIM("applications"."full_name"), '') AS "full_name",
    COALESCE(
      NULLIF(BTRIM("applications"."phone"), ''),
      NULLIF(BTRIM("applications"."application_data" ->> 'phone'), '')
    ) AS "phone",
    "applications"."application_data"
  FROM "ibpa"."applications" AS "applications"
  WHERE "applications"."user_id" IS NOT NULL
  ORDER BY "applications"."user_id", "applications"."created_at" DESC
),
normalized_profile_seed AS (
  SELECT
    "latest_applications"."user_id",
    NULLIF(SPLIT_PART("latest_applications"."full_name", ' ', 1), '') AS "first_name",
    NULLIF(REGEXP_REPLACE("latest_applications"."full_name", '^\S+\s*', ''), '') AS "last_name",
    "latest_applications"."phone" AS "phone",
    NULLIF(BTRIM("latest_applications"."application_data" ->> 'professionalDesc'), '') AS "bio",
    COALESCE(
      NULLIF(BTRIM("latest_applications"."application_data" ->> 'educationDesc'), ''),
      NULLIF(BTRIM("latest_applications"."application_data" ->> 'studentSchool'), '')
    ) AS "credentials",
    NULLIF(BTRIM("latest_applications"."application_data" ->> 'achievementsDesc'), '') AS "achievements",
    NULLIF(BTRIM("latest_applications"."application_data" ->> 'contributionDesc'), '') AS "industry_contribution",
    CASE
      WHEN JSONB_TYPEOF("latest_applications"."application_data" -> 'portfolioImages') = 'array'
        THEN "latest_applications"."application_data" -> 'portfolioImages'
      ELSE '[]'::jsonb
    END AS "work_gallery_photos",
    CASE
      WHEN JSONB_TYPEOF("latest_applications"."application_data" -> 'specialization') = 'array'
        THEN "latest_applications"."application_data" -> 'specialization'
      WHEN NULLIF(BTRIM("latest_applications"."application_data" ->> 'specialization'), '') IS NOT NULL
        THEN TO_JSONB(ARRAY[NULLIF(BTRIM("latest_applications"."application_data" ->> 'specialization'), '')])
      WHEN NULLIF(BTRIM("latest_applications"."application_data" ->> 'bizServices'), '') IS NOT NULL
        THEN TO_JSONB(REGEXP_SPLIT_TO_ARRAY(NULLIF(BTRIM("latest_applications"."application_data" ->> 'bizServices'), ''), '\s*,\s*'))
      ELSE '[]'::jsonb
    END AS "specializations",
    NULLIF(BTRIM("latest_applications"."application_data" ->> 'city'), '') AS "city",
    NULLIF(BTRIM("latest_applications"."application_data" ->> 'state'), '') AS "state",
    NULLIF(BTRIM("latest_applications"."application_data" ->> 'country'), '') AS "country",
    NULLIF(BTRIM("latest_applications"."application_data" ->> 'websiteLink'), '') AS "website",
    NULLIF(BTRIM("latest_applications"."application_data" ->> 'instagramLink'), '') AS "instagram",
    CASE
      WHEN NULLIF(REGEXP_REPLACE(COALESCE("latest_applications"."application_data" ->> 'yearsExperience', ''), '[^0-9]', '', 'g'), '') IS NOT NULL
        THEN NULLIF(REGEXP_REPLACE(COALESCE("latest_applications"."application_data" ->> 'yearsExperience', ''), '[^0-9]', '', 'g'), '')::integer
      ELSE NULL
    END AS "years_experience"
  FROM "latest_applications"
)
UPDATE "ibpa"."profiles" AS "profiles"
SET
  "first_name" = COALESCE("profiles"."first_name", "seed"."first_name"),
  "last_name" = COALESCE("profiles"."last_name", "seed"."last_name"),
  "phone" = COALESCE("profiles"."phone", "seed"."phone"),
  "bio" = COALESCE("profiles"."bio", "seed"."bio"),
  "credentials" = COALESCE("profiles"."credentials", "seed"."credentials"),
  "achievements" = COALESCE("profiles"."achievements", "seed"."achievements"),
  "industry_contribution" = COALESCE("profiles"."industry_contribution", "seed"."industry_contribution"),
  "work_gallery_photos" = CASE
    WHEN COALESCE(JSONB_ARRAY_LENGTH("profiles"."work_gallery_photos"), 0) = 0
      THEN "seed"."work_gallery_photos"
    ELSE "profiles"."work_gallery_photos"
  END,
  "specializations" = CASE
    WHEN COALESCE(JSONB_ARRAY_LENGTH("profiles"."specializations"), 0) = 0
      THEN "seed"."specializations"
    ELSE "profiles"."specializations"
  END,
  "city" = COALESCE("profiles"."city", "seed"."city"),
  "state" = COALESCE("profiles"."state", "seed"."state"),
  "country" = COALESCE("profiles"."country", "seed"."country"),
  "website" = COALESCE("profiles"."website", "seed"."website"),
  "instagram" = COALESCE("profiles"."instagram", "seed"."instagram"),
  "years_experience" = COALESCE("profiles"."years_experience", "seed"."years_experience"),
  "updated_at" = NOW()
FROM "normalized_profile_seed" AS "seed"
WHERE "profiles"."user_id" = "seed"."user_id";

--> statement-breakpoint

INSERT INTO "ibpa"."profiles" (
  "user_id",
  "first_name",
  "last_name",
  "phone",
  "bio",
  "credentials",
  "achievements",
  "industry_contribution",
  "services",
  "work_gallery_photos",
  "specializations",
  "city",
  "state",
  "country",
  "website",
  "instagram",
  "years_experience"
)
WITH latest_applications AS (
  SELECT DISTINCT ON ("applications"."user_id")
    "applications"."user_id",
    NULLIF(BTRIM("applications"."full_name"), '') AS "full_name",
    COALESCE(
      NULLIF(BTRIM("applications"."phone"), ''),
      NULLIF(BTRIM("applications"."application_data" ->> 'phone'), '')
    ) AS "phone",
    "applications"."application_data"
  FROM "ibpa"."applications" AS "applications"
  WHERE "applications"."user_id" IS NOT NULL
  ORDER BY "applications"."user_id", "applications"."created_at" DESC
),
normalized_profile_seed AS (
  SELECT
    "latest_applications"."user_id",
    NULLIF(SPLIT_PART("latest_applications"."full_name", ' ', 1), '') AS "first_name",
    NULLIF(REGEXP_REPLACE("latest_applications"."full_name", '^\S+\s*', ''), '') AS "last_name",
    "latest_applications"."phone" AS "phone",
    NULLIF(BTRIM("latest_applications"."application_data" ->> 'professionalDesc'), '') AS "bio",
    COALESCE(
      NULLIF(BTRIM("latest_applications"."application_data" ->> 'educationDesc'), ''),
      NULLIF(BTRIM("latest_applications"."application_data" ->> 'studentSchool'), '')
    ) AS "credentials",
    NULLIF(BTRIM("latest_applications"."application_data" ->> 'achievementsDesc'), '') AS "achievements",
    NULLIF(BTRIM("latest_applications"."application_data" ->> 'contributionDesc'), '') AS "industry_contribution",
    CASE
      WHEN JSONB_TYPEOF("latest_applications"."application_data" -> 'portfolioImages') = 'array'
        THEN "latest_applications"."application_data" -> 'portfolioImages'
      ELSE '[]'::jsonb
    END AS "work_gallery_photos",
    CASE
      WHEN JSONB_TYPEOF("latest_applications"."application_data" -> 'specialization') = 'array'
        THEN "latest_applications"."application_data" -> 'specialization'
      WHEN NULLIF(BTRIM("latest_applications"."application_data" ->> 'specialization'), '') IS NOT NULL
        THEN TO_JSONB(ARRAY[NULLIF(BTRIM("latest_applications"."application_data" ->> 'specialization'), '')])
      WHEN NULLIF(BTRIM("latest_applications"."application_data" ->> 'bizServices'), '') IS NOT NULL
        THEN TO_JSONB(REGEXP_SPLIT_TO_ARRAY(NULLIF(BTRIM("latest_applications"."application_data" ->> 'bizServices'), ''), '\s*,\s*'))
      ELSE '[]'::jsonb
    END AS "specializations",
    NULLIF(BTRIM("latest_applications"."application_data" ->> 'city'), '') AS "city",
    NULLIF(BTRIM("latest_applications"."application_data" ->> 'state'), '') AS "state",
    NULLIF(BTRIM("latest_applications"."application_data" ->> 'country'), '') AS "country",
    NULLIF(BTRIM("latest_applications"."application_data" ->> 'websiteLink'), '') AS "website",
    NULLIF(BTRIM("latest_applications"."application_data" ->> 'instagramLink'), '') AS "instagram",
    CASE
      WHEN NULLIF(REGEXP_REPLACE(COALESCE("latest_applications"."application_data" ->> 'yearsExperience', ''), '[^0-9]', '', 'g'), '') IS NOT NULL
        THEN NULLIF(REGEXP_REPLACE(COALESCE("latest_applications"."application_data" ->> 'yearsExperience', ''), '[^0-9]', '', 'g'), '')::integer
      ELSE NULL
    END AS "years_experience"
  FROM "latest_applications"
)
SELECT
  "seed"."user_id",
  "seed"."first_name",
  "seed"."last_name",
  "seed"."phone",
  "seed"."bio",
  "seed"."credentials",
  "seed"."achievements",
  "seed"."industry_contribution",
  '[]'::jsonb,
  "seed"."work_gallery_photos",
  "seed"."specializations",
  "seed"."city",
  "seed"."state",
  "seed"."country",
  "seed"."website",
  "seed"."instagram",
  "seed"."years_experience"
FROM "normalized_profile_seed" AS "seed"
LEFT JOIN "ibpa"."profiles" AS "profiles"
  ON "profiles"."user_id" = "seed"."user_id"
WHERE "profiles"."user_id" IS NULL;
