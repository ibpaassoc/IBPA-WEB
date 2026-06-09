import type { AdminOrder, AdminPartnerApplication, AdminStatusTone } from "../../shared/types/admin.types";

export type AdminPaymentSource = "member" | "partner";

export type AdminPaymentStatus = "paid" | "pending" | "unpaid" | "failed";

export type AdminPaymentFilters = {
  source: "all" | AdminPaymentSource;
  status: "all" | AdminPaymentStatus;
};

export type AdminPaymentRecord = {
  dateLabel: string;
  href: string;
  id: string;
  packageLabel: string;
  payerEmail: string;
  payerName: string;
  raw: AdminOrder | AdminPartnerApplication;
  source: AdminPaymentSource;
  sourceLabel: string;
  statusLabel: string;
  statusTone: AdminStatusTone;
  status: AdminPaymentStatus;
  timestamp: number;
};

export type AdminPaymentStats = {
  failed: number;
  paid: number;
  pending: number;
  total: number;
};
