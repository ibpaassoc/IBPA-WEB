import "../src/load-env";
import { eq } from "drizzle-orm";
import { requireDb } from "../src/lib/db";
import { coreApplications } from "../src/lib/schema";
import { findCanonicalUserByEmail } from "../src/features/users/server/user.repository";
import { ensureCanonicalUser } from "../src/features/users/server/user.service";
import { findProfileByUserId, upsertCanonicalProfile } from "../src/features/profiles/server/profile.repository";
import {
  computeProfileFill,
  mapApplicationPayloadToProfile,
} from "../src/features/profiles/server/application-profile-sync";

/**
 * One-time, idempotent backfill: populate empty `profiles` rows from the payload
 * of paid member/partner applications.
 *
 * Safe by default (dry run). Nothing is written unless `--apply` is passed.
 *
 *   Dry run (default):  tsx scripts/backfill-paid-application-profiles.ts
 *   Apply changes:      tsx scripts/backfill-paid-application-profiles.ts --apply
 *
 * Trust boundary: only applications with canonical status = 'PAID' are processed.
 * Only missing/empty/placeholder profile fields are filled; manual edits and
 * non-empty values are never overwritten.
 */

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const DRY_RUN = !APPLY; // dry-run is the default; --dry-run is accepted for clarity

type SkipReason = "no-user-resolved";

const summary = {
  scanned: 0,
  profilesCreated: 0,
  profilesUpdated: 0,
  unchanged: 0,
  skipped: [] as Array<{ applicationId: string; email: string; reason: SkipReason }>,
  errors: [] as Array<{ applicationId: string; email: string; message: string }>,
};

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function resolveUserId(
  db: ReturnType<typeof requireDb>,
  application: typeof coreApplications.$inferSelect,
): Promise<{ userId: string | null; via: string }> {
  // 1. Existing application -> user relation.
  if (application.userId) {
    return { userId: application.userId, via: "application.userId" };
  }

  // 2. Normalized email match against canonical users.
  const email = normalizeEmail(application.email);
  if (email) {
    const byEmail = await findCanonicalUserByEmail(db, email);
    if (byEmail) {
      return { userId: byEmail.id, via: "email-match" };
    }

    // 3. Trusted paid record with no user yet -> ensure one (apply mode only).
    if (APPLY) {
      const ensured = await ensureCanonicalUser(db, {
        email,
        clerkId: null,
        role: application.type === "PARTNER" ? "PARTNER" : "MEMBER",
        status: "ACTIVE",
      });
      return { userId: ensured.record.id, via: "ensured-user" };
    }

    return { userId: null, via: "would-ensure-user" };
  }

  return { userId: null, via: "no-email" };
}

async function main() {
  const db = requireDb();

  console.log(`\n[Backfill] Mode: ${APPLY ? "APPLY (writes enabled)" : "DRY RUN (no writes)"}`);

  const paidApplications = await db
    .select()
    .from(coreApplications)
    .where(eq(coreApplications.status, "PAID"));

  console.log(`[Backfill] Paid applications found: ${paidApplications.length}\n`);

  for (const application of paidApplications) {
    summary.scanned += 1;
    const email = normalizeEmail(application.email);

    try {
      const { userId, via } = await resolveUserId(db, application);

      if (!userId) {
        summary.skipped.push({ applicationId: application.id, email, reason: "no-user-resolved" });
        console.log(`  SKIP  ${application.id} (${email || "no email"}) — could not resolve a user (${via})`);
        continue;
      }

      const existing = await findProfileByUserId(db, userId);
      const candidates = mapApplicationPayloadToProfile({
        id: application.id,
        type: application.type,
        fullName: application.fullName,
        phone: application.phone,
        packageName: application.packageName,
        applicationData: application.applicationData,
      });
      const { update, filledFields } = computeProfileFill(existing, candidates);

      const willCreate = !existing;
      const willChange = willCreate || filledFields.length > 0;

      if (!willChange) {
        summary.unchanged += 1;
        continue;
      }

      const action = willCreate ? "CREATE" : "UPDATE";
      const fieldList = filledFields.length > 0 ? filledFields.join(", ") : "(ensure row exists)";
      console.log(`  ${action}  ${application.id} (${email}) via ${via} -> ${fieldList}`);

      if (APPLY) {
        const { created } = await upsertCanonicalProfile(db, { userId, ...update });
        if (created) {
          summary.profilesCreated += 1;
        } else {
          summary.profilesUpdated += 1;
        }
      } else {
        if (willCreate) {
          summary.profilesCreated += 1;
        } else {
          summary.profilesUpdated += 1;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      summary.errors.push({ applicationId: application.id, email, message });
      console.error(`  ERROR ${application.id} (${email}): ${message}`);
    }
  }

  console.log("\n[Backfill] ---------------- Summary ----------------");
  console.log(`  Mode:               ${APPLY ? "APPLY" : "DRY RUN"}`);
  console.log(`  Scanned:            ${summary.scanned}`);
  console.log(`  Profiles created:   ${summary.profilesCreated}${DRY_RUN ? " (would create)" : ""}`);
  console.log(`  Profiles updated:   ${summary.profilesUpdated}${DRY_RUN ? " (would update)" : ""}`);
  console.log(`  Unchanged:          ${summary.unchanged}`);
  console.log(`  Skipped:            ${summary.skipped.length}`);
  console.log(`  Errors:             ${summary.errors.length}`);

  if (summary.skipped.length > 0) {
    console.log("\n  Skipped records:");
    for (const item of summary.skipped) {
      console.log(`    - ${item.applicationId} (${item.email || "no email"}): ${item.reason}`);
    }
  }
  if (summary.errors.length > 0) {
    console.log("\n  Errors:");
    for (const item of summary.errors) {
      console.log(`    - ${item.applicationId} (${item.email}): ${item.message}`);
    }
  }

  if (DRY_RUN) {
    console.log("\n[Backfill] Dry run complete. Re-run with --apply to write these changes.");
  } else {
    console.log("\n[Backfill] Apply complete.");
  }
}

main().catch((error) => {
  console.error("[Backfill] Fatal error:", error);
  process.exit(1);
});
