import type { AdminStatusTone } from "../../shared/types/admin.types";

export type AdminOverviewStat = {
  key: string;
  label: string;
  value: number;
  href: string;
  change?: { value: number; label: string } | null;
};

export type AdminOverviewEvent = {
  id: string;
  title: string;
  dateLabel: string;
  location: string;
  href: string;
  registrationCount?: number;
};

export type AdminOverviewPayment = {
  id: string;
  name: string;
  source: "member" | "partner";
  sourceLabel: string;
  statusLabel: string;
  statusTone: AdminStatusTone;
  dateLabel: string;
  href: string;
};

export type AdminOverviewActivity = {
  id: string;
  title: string;
  description: string;
  dateLabel: string;
  tone: AdminStatusTone;
  href: string;
};

export type AdminOverviewData = {
  stats: AdminOverviewStat[];
  upcomingEvents: AdminOverviewEvent[];
  recentPayments: AdminOverviewPayment[];
  recentActivity: AdminOverviewActivity[];
};
