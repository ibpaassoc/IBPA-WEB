import type { AdminClient, AdminStatusTone } from "../../shared/types/admin.types";
import type { AdminMemberFilters, AdminMemberRecord } from "../types/members-admin.types";

const EXPIRING_SOON_DAYS = 60;

function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;
  return Math.ceil((time - Date.now()) / (1000 * 60 * 60 * 24));
}

function buildExpiry(days: number | null): { label: string; tone: AdminStatusTone } {
  if (days === null) return { label: "No expiry on file", tone: "neutral" };
  if (days < 0) return { label: "Expired", tone: "danger" };
  if (days <= 30) return { label: days === 0 ? "Expires today" : `Expires in ${days}d`, tone: "danger" };
  if (days <= EXPIRING_SOON_DAYS) return { label: `Expires in ${days}d`, tone: "warning" };
  return { label: `Expires in ${days}d`, tone: "success" };
}

export function toMemberRecord(client: AdminClient): AdminMemberRecord {
  const days = daysUntil(client.expiresAt);
  const expiry = buildExpiry(days);
  const hasCertificate = Boolean(client.certificateUrl);

  return {
    ...client,
    daysUntilExpiry: days,
    expiryLabel: expiry.label,
    expiryTone: expiry.tone,
    hasCertificate,
    certStatusLabel: hasCertificate ? "Issued" : "Not issued",
    certStatusTone: hasCertificate ? "success" : "neutral",
    isLinked: Boolean(client.userId && client.hasDashboardAccess),
  };
}

export function filterMemberRecords(
  records: AdminMemberRecord[],
  filters: AdminMemberFilters,
): AdminMemberRecord[] {
  return records.filter((record) => {
    if (
      filters.membership !== "all" &&
      (record.membershipCategory || "Uncategorized") !== filters.membership
    ) {
      return false;
    }

    if (filters.certificate === "issued" && !record.hasCertificate) return false;
    if (filters.certificate === "not_issued" && record.hasCertificate) return false;

    return true;
  });
}
