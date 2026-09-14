import "../src/load-env";
import { asc } from "drizzle-orm";
import { requireDb } from "../src/lib/db";
import { coreWebinars } from "../src/lib/schema";
import { ensureWebinarSubtitleState } from "../src/features/webinars/server/webinar-subtitles.service";
import { isInitializedSubtitleState } from "../src/features/webinars/server/webinar-subtitle-state";

/**
 * Eagerly registers pre-versioning R2 subtitle tracks as subtitle versions on
 * each webinar record. The same registration also runs lazily the first time a
 * webinar is opened, so this script is optional.
 *
 * Non-destructive: R2 objects are only read; nothing is moved or rewritten.
 * Requires migration 0019_webinar_subtitle_versions_and_access.
 *
 * Safe by default (dry run). Nothing is written unless `--apply` is passed.
 *
 *   Dry run (default):  tsx scripts/migrate-webinar-subtitle-versions.ts
 *   Apply changes:      tsx scripts/migrate-webinar-subtitle-versions.ts --apply
 */

const APPLY = process.argv.slice(2).includes("--apply");

async function main() {
  const db = requireDb();
  const webinars = await db
    .select()
    .from(coreWebinars)
    .orderBy(asc(coreWebinars.createdAt));

  const pending = webinars.filter(
    (webinar: typeof coreWebinars.$inferSelect) =>
      !isInitializedSubtitleState(webinar.subtitleVersions) &&
      webinar.status !== "IMPORTING",
  );

  console.log(
    `[webinar subtitles] ${webinars.length} webinars, ${pending.length} need registration${APPLY ? "" : " (dry run)"}`,
  );

  for (const webinar of pending) {
    if (!APPLY) {
      console.log(`  would register ${webinar.id} · ${webinar.title}`);
      continue;
    }
    try {
      const { state } = await ensureWebinarSubtitleState(webinar, db);
      console.log(
        `  registered ${webinar.id} · ${state.versions.map((version) => version.kind).join(", ") || "no tracks"}`,
      );
    } catch (error) {
      console.error(
        `  failed ${webinar.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
