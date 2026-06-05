import type { SourceOrderRecord, SourceUserRecord } from "@/features/shared/server/source-records";
import type { UserRole } from "@/lib/permissions";
import { requireDb } from "@/lib/db";
import { upsertCanonicalUser } from "./user.repository";
import type { EnsureCanonicalUserInput } from "./user.types";

type DbClient = ReturnType<typeof requireDb>;

export function resolveUserRole(input: {
  role?: unknown;
  accountType?: unknown;
  applicantType?: unknown;
  hasTeamOwnerAccess?: boolean;
}): UserRole {
  const explicitRole = typeof input.role === "string" ? input.role.trim().toUpperCase() : "";
  if (explicitRole === "ADMIN" || explicitRole === "MEMBER" || explicitRole === "PARTNER" || explicitRole === "TEAM_MEMBER") {
    return explicitRole;
  }

  const accountType = typeof input.accountType === "string" ? input.accountType.trim().toLowerCase() : "";
  const applicantType = typeof input.applicantType === "string" ? input.applicantType.trim().toLowerCase() : "";

  if (input.hasTeamOwnerAccess || accountType === "partner" || applicantType.includes("partner")) {
    return "PARTNER";
  }

  if (accountType.includes("team") || applicantType.includes("team")) {
    return "TEAM_MEMBER";
  }

  return "MEMBER";
}

export async function ensureCanonicalUser(db: DbClient, input: EnsureCanonicalUserInput) {
  return upsertCanonicalUser(db, {
    clerkId: input.clerkId ?? null,
    email: input.email.trim().toLowerCase(),
    role: input.role,
    status: input.status ?? "ACTIVE",
  });
}

export async function syncCanonicalUserFromSourceUser(db: DbClient, sourceUser: SourceUserRecord) {
  return ensureCanonicalUser(db, {
    clerkId: sourceUser.clerkId,
    email: sourceUser.email,
    role: "MEMBER",
    status: "ACTIVE",
  });
}

export async function syncCanonicalUserFromSourceOrder(db: DbClient, sourceOrder: SourceOrderRecord) {
  return ensureCanonicalUser(db, {
    email: sourceOrder.email,
    role: resolveUserRole({
      accountType: sourceOrder.accountType,
      applicantType: sourceOrder.applicantType,
    }),
    status: sourceOrder.status === "rejected" ? "INACTIVE" : "ACTIVE",
  });
}
