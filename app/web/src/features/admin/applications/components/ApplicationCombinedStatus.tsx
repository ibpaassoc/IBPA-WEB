import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import type { AdminStatusTone } from "../../shared/types/admin.types";
import type { AdminApplicationRecord } from "../types/application-admin.types";

function getCombinedStatus(record: AdminApplicationRecord): { label: string; tone: AdminStatusTone } {
  const s = record.status;
  const p = record.paymentStatus;

  if (s === "paid" || (s === "approved" && p === "paid")) return { label: "Paid", tone: "success" };
  if (s === "approved" && p === "pending") return { label: "Payment pending", tone: "warning" };
  if (s === "approved") return { label: "Approved", tone: "success" };
  if (s === "rejected") return { label: "Rejected", tone: "danger" };
  if (s === "review") return { label: "Under review", tone: "info" };
  if (s === "pending") return { label: "Pending", tone: "neutral" };
  if (s === "submitted") return { label: "Submitted", tone: "neutral" };
  return { label: record.statusLabel, tone: record.statusTone };
}

export function ApplicationCombinedStatus({ record }: { record: AdminApplicationRecord }) {
  const { label, tone } = getCombinedStatus(record);
  return <AdminStatusBadge tone={tone}>{label}</AdminStatusBadge>;
}
