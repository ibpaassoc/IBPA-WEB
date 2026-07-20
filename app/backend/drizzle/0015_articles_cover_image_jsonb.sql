ALTER TABLE "ibpa"."articles"
  ALTER COLUMN "cover_image" TYPE jsonb
  USING CASE
    WHEN "cover_image" IS NULL OR btrim("cover_image") = '' THEN NULL
    ELSE jsonb_build_object('url', "cover_image", 'aspect', NULL, 'zoom', NULL)
  END;

--> statement-breakpoint

COMMENT ON COLUMN "ibpa"."articles"."cover_image" IS
  'Cover image summary: { url, aspect, zoom }. Full presentation metadata lives in image_presentation.';

--> statement-breakpoint

COMMENT ON COLUMN "ibpa"."events"."cover_image" IS
  'Cover image summary: { url, aspect, zoom }. Full presentation metadata lives in image_presentation.';
