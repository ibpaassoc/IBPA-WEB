import "../src/load-env";
import { asc, eq, isNull } from "drizzle-orm";
import { requireDb } from "../src/lib/db";
import { coreTeamMembers, coreTeams } from "../src/lib/schema";
import { generateTeamMemberCredential } from "../src/features/teams/server/team-credential";

/**
 * One-time, idempotent backfill: assign a credential to every team member that
 * doesn't have one yet, in the format TEAM-<teamNumber>-<YYYYMMDD>-<hex>.
 *
 * The team number is the team's 1-based position ordered by creation, matching
 * the IBPA-BO-### owner-id scheme used across the dashboard.
 *
 * Safe by default (dry run). Nothing is written unless `--apply` is passed.
 *
 *   Dry run (default):  tsx scripts/backfill-team-member-credentials.ts
 *   Apply changes:      tsx scripts/backfill-team-member-credentials.ts --apply
 */

const args = new Set(process.argv.slice(2));
const APPLY = args.has("--apply");
const DRY_RUN = !APPLY;

const summary = {
  scanned: 0,
  assigned: 0,
  alreadyHad: 0,
  errors: [] as Array<{ id: string; message: string }>,
};

async function main() {
  const db = requireDb();

  console.log(`\n[Backfill:credentials] Mode: ${APPLY ? "APPLY (writes enabled)" : "DRY RUN (no writes)"}`);

  // Team number -> 1-based index by creation order (shared by all members of a team).
  const teams = await db
    .select({ id: coreTeams.id })
    .from(coreTeams)
    .orderBy(asc(coreTeams.createdAt), asc(coreTeams.id));
  const teamNumberById = new Map<string, number>();
  teams.forEach((team: { id: string }, index: number) => teamNumberById.set(team.id, index + 1));

  const members = await db
    .select()
    .from(coreTeamMembers)
    .where(isNull(coreTeamMembers.credentials))
    .orderBy(asc(coreTeamMembers.teamId), asc(coreTeamMembers.joinedAt), asc(coreTeamMembers.id));

  console.log(`[Backfill:credentials] Team members missing a credential: ${members.length}\n`);

  // Track credentials issued in this run so retries stay unique within the batch.
  const issued = new Set<string>();

  for (const member of members) {
    summary.scanned += 1;

    if (member.credentials) {
      summary.alreadyHad += 1;
      continue;
    }

    try {
      const teamNumber = teamNumberById.get(member.teamId) ?? teams.length + 1;

      let credential = "";
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const candidate = generateTeamMemberCredential({
          teamNumber,
          date: member.joinedAt ?? new Date(),
        });
        if (!issued.has(candidate)) {
          credential = candidate;
          break;
        }
      }
      if (!credential) {
        throw new Error("Could not generate a unique credential after multiple attempts.");
      }
      issued.add(credential);

      console.log(`  ASSIGN ${member.id} (team ${teamNumber}, ${member.email}) -> ${credential}`);

      if (APPLY) {
        await db
          .update(coreTeamMembers)
          .set({ credentials: credential })
          .where(eq(coreTeamMembers.id, member.id));
      }
      summary.assigned += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      summary.errors.push({ id: member.id, message });
      console.error(`  ERROR ${member.id}: ${message}`);
    }
  }

  console.log("\n[Backfill:credentials] ---------------- Summary ----------------");
  console.log(`  Mode:            ${APPLY ? "APPLY" : "DRY RUN"}`);
  console.log(`  Scanned:         ${summary.scanned}`);
  console.log(`  Assigned:        ${summary.assigned}${DRY_RUN ? " (would assign)" : ""}`);
  console.log(`  Already had one: ${summary.alreadyHad}`);
  console.log(`  Errors:          ${summary.errors.length}`);

  if (summary.errors.length > 0) {
    console.log("\n  Errors:");
    for (const item of summary.errors) {
      console.log(`    - ${item.id}: ${item.message}`);
    }
  }

  if (DRY_RUN) {
    console.log("\n[Backfill:credentials] Dry run complete. Re-run with --apply to write these changes.");
  } else {
    console.log("\n[Backfill:credentials] Apply complete.");
  }
}

main().catch((error) => {
  console.error("[Backfill:credentials] Fatal error:", error);
  process.exit(1);
});
