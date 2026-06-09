import type { AdminClient, AdminStatusTone } from "../../shared/types/admin.types";
import type {
  AdminMembershipFilters,
  AdminMembershipRecord,
  AdminMembershipStats,
} from "../types/membership-admin.types";

const EXPIRING_SOON_DAYS = 60;
const CRITICAL_DAYS = 30;

function daysUntil(value?: string | null) {
  if (!value) return null;

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;

  return Math.ceil((time - Date.now()) / (1000 * 60 * 60 * 24));
}

function buildExpiry(days: number | null): { label: string; tone: AdminStatusTone } {
  if (days === null) {
    return { label: "No expiry on file", tone: "neutral" };
  }

  if (days < 0) {
    return { label: "Expired", tone: "danger" };
  }

  if (days <= CRITICAL_DAYS) {
    return { label: days === 0 ? "Expires today" : `Expires in ${days}d`, tone: "danger" };
  }

  if (days <= EXPIRING_SOON_DAYS) {
    return { label: `Expires in ${days}d`, tone: "warning" };
  }

  return { label: `Expires in ${days}d`, tone: "success" };
}

export function toMembershipRecord(client: AdminClient): AdminMembershipRecord {
  const days = daysUntil(client.expiresAt);
  const expiry = buildExpiry(days);

  return {
    ...client,
    daysUntilExpiry: days,
    expiryLabel: expiry.label,
    expiryTone: expiry.tone,
  };
}

export function filterMembershipRecords(
  records: AdminMembershipRecord[],
  filters: AdminMembershipFilters,
) {
  return records.filter((record) => {
    if (filters.category !== "all" && (record.membershipCategory || "Uncategorized") !== filters.category) {
      return false;
    }

    if (filters.expiry === "expiring_soon") {
      if (record.daysUntilExpiry === null || record.daysUntilExpiry < 0 || record.daysUntilExpiry > EXPIRING_SOON_DAYS) {
        return false;
      }
    }

    return true;
  });
}

export function buildMembershipStats(records: AdminMembershipRecord[]): AdminMembershipStats {
  const categoryCounts = new Map<string, number>();
  let expiringSoon = 0;

  for (const record of records) {
    const category = record.membershipCategory || "Uncategorized";
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);

    if (record.daysUntilExpiry !== null && record.daysUntilExpiry >= 0 && record.daysUntilExpiry <= EXPIRING_SOON_DAYS) {
      expiringSoon += 1;
    }
  }

  const categories = Array.from(categoryCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return {
    categories,
    expiringSoon,
    total: records.length,
  };
}
