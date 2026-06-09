import type { AdminOrder, AdminPartnerApplication, AdminStatusTone } from "../../shared/types/admin.types";
import { formatAdminDate } from "../../shared/utils/admin-formatters";
import type {
  AdminPaymentFilters,
  AdminPaymentRecord,
  AdminPaymentStats,
  AdminPaymentStatus,
} from "../types/payment-admin.types";

function toTimestamp(value?: string | null) {
  if (!value) return 0;

  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

const STATUS_PRESENTATION: Record<AdminPaymentStatus, { label: string; tone: AdminStatusTone }> = {
  failed: { label: "Failed", tone: "danger" },
  paid: { label: "Paid", tone: "success" },
  pending: { label: "Pending", tone: "warning" },
  unpaid: { label: "Unpaid", tone: "neutral" },
};

function toMemberPaymentStatus(order: AdminOrder): AdminPaymentStatus {
  if (order.status === "paid") return "paid";
  if (order.status === "rejected") return "failed";
  return "pending";
}

function toPartnerPaymentStatus(application: AdminPartnerApplication): AdminPaymentStatus {
  switch (application.paymentStatus) {
    case "PAID":
      return "paid";
    case "FAILED":
      return "failed";
    case "PENDING":
      return "pending";
    default:
      return "unpaid";
  }
}

function toMemberRecord(order: AdminOrder): AdminPaymentRecord {
  const status = toMemberPaymentStatus(order);
  const presentation = STATUS_PRESENTATION[status];
  const timestamp = toTimestamp(order.createdAt);

  return {
    dateLabel: formatAdminDate(order.createdAt),
    href: "/admin/applications",
    id: `member:${order.id}`,
    packageLabel: order.membershipCategory || "Membership",
    payerEmail: order.email,
    payerName: order.name || order.email,
    raw: order,
    source: "member",
    sourceLabel: "Member",
    status,
    statusLabel: presentation.label,
    statusTone: presentation.tone,
    timestamp,
  };
}

function toPartnerRecord(application: AdminPartnerApplication): AdminPaymentRecord {
  const status = toPartnerPaymentStatus(application);
  const presentation = STATUS_PRESENTATION[status];
  const timestamp = toTimestamp(application.paidAt ?? application.updatedAt ?? application.createdAt);

  return {
    dateLabel: formatAdminDate(application.paidAt ?? application.updatedAt ?? application.createdAt),
    href: "/admin/applications?applicantType=partner",
    id: `partner:${application.id}`,
    packageLabel: application.requestedTier || "Partnership",
    payerEmail: application.email,
    payerName: application.name || application.email,
    raw: application,
    source: "partner",
    sourceLabel: "Partner",
    status,
    statusLabel: presentation.label,
    statusTone: presentation.tone,
    timestamp,
  };
}

export function buildPaymentRecords(memberOrders: AdminOrder[], partnerApplications: AdminPartnerApplication[]) {
  return [...memberOrders.map(toMemberRecord), ...partnerApplications.map(toPartnerRecord)].sort(
    (a, b) => b.timestamp - a.timestamp,
  );
}

export function filterPaymentRecords(records: AdminPaymentRecord[], filters: AdminPaymentFilters) {
  return records.filter((record) => {
    if (filters.source !== "all" && record.source !== filters.source) return false;
    if (filters.status !== "all" && record.status !== filters.status) return false;
    return true;
  });
}

export function searchPaymentRecords(records: AdminPaymentRecord[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return records;

  return records.filter((record) =>
    [record.payerName, record.payerEmail, record.packageLabel, record.sourceLabel]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(needle)),
  );
}

export function buildPaymentStats(records: AdminPaymentRecord[]): AdminPaymentStats {
  let paid = 0;
  let pending = 0;
  let failed = 0;

  for (const record of records) {
    if (record.status === "paid") paid += 1;
    else if (record.status === "pending") pending += 1;
    else if (record.status === "failed") failed += 1;
  }

  return { failed, paid, pending, total: records.length };
}
