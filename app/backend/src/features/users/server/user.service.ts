import type { Order, User as LegacyUser } from "@/lib/schema";
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

export async function syncCanonicalUserFromLegacyUser(db: DbClient, legacyUser: LegacyUser) {
  return ensureCanonicalUser(db, {
    clerkId: legacyUser.clerkId,
    email: legacyUser.email,
    role: "MEMBER",
    status: "ACTIVE",
  });
}

export async function syncCanonicalUserFromLegacyOrder(db: DbClient, legacyOrder: Order) {
  return ensureCanonicalUser(db, {
    email: legacyOrder.email,
    role: resolveUserRole({
      accountType: legacyOrder.accountType,
      applicantType: legacyOrder.applicantType,
    }),
    status: legacyOrder.status === "rejected" ? "INACTIVE" : "ACTIVE",
  });
}
