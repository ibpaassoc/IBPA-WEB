import type { AdminClient, AdminStatusTone } from "../../shared/types/admin.types";

export type AdminCertificateStatusFilter = "all" | "issued" | "not_issued";

export type AdminCertificateFilters = {
  category: "all" | string;
  status: AdminCertificateStatusFilter;
};

export type AdminCertificateRecord = AdminClient & {
  hasCertificate: boolean;
  statusLabel: string;
  statusTone: AdminStatusTone;
};

export type AdminCertificateStats = {
  issued: number;
  notIssued: number;
  total: number;
};

export type CertificateActionResult = {
  certificateUrl?: string | null;
  success?: boolean;
};
