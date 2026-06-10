import type { AdminClient } from "../../shared/types/admin.types";
import type {
  AdminUserFilters,
  AdminUserRecord,
  AdminUserStats,
} from "../types/user-admin.types";

export function toUserRecord(client: AdminClient): AdminUserRecord {
  const isLinked = Boolean(client.userId && client.hasDashboardAccess);

  return {
    ...client,
    accessLabel: isLinked ? "Dashboard linked" : "Not linked",
    accessTone: isLinked ? "success" : "neutral",
  };
}

export function filterUserRecords(records: AdminUserRecord[], filters: AdminUserFilters) {
  return records.filter((record) => {
    if (filters.membership !== "all" && (record.membershipCategory || "Uncategorized") !== filters.membership) {
      return false;
    }

    const isLinked = Boolean(record.userId && record.hasDashboardAccess);
    if (filters.access === "linked" && !isLinked) return false;
    if (filters.access === "not_linked" && isLinked) return false;

    return true;
  });
}

export function buildUserStats(records: AdminUserRecord[]): AdminUserStats {
  const linked = records.filter((record) => Boolean(record.userId && record.hasDashboardAccess)).length;

  return {
    linked,
    notLinked: records.length - linked,
    total: records.length,
  };
}
