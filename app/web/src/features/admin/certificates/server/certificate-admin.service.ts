import type { AdminClient } from "../../shared/types/admin.types";
import type {
  AdminCertificateFilters,
  AdminCertificateRecord,
  AdminCertificateStats,
} from "../types/certificate-admin.types";

export function toCertificateRecord(client: AdminClient): AdminCertificateRecord {
  const hasCertificate = Boolean(client.certificateUrl);

  return {
    ...client,
    hasCertificate,
    statusLabel: hasCertificate ? "Issued" : "Not issued",
    statusTone: hasCertificate ? "success" : "neutral",
  };
}

export function filterCertificateRecords(
  records: AdminCertificateRecord[],
  filters: AdminCertificateFilters,
) {
  return records.filter((record) => {
    if (filters.category !== "all" && (record.membershipCategory || "Uncategorized") !== filters.category) {
      return false;
    }

    if (filters.status === "issued" && !record.hasCertificate) return false;
    if (filters.status === "not_issued" && record.hasCertificate) return false;

    return true;
  });
}

export function buildCertificateStats(records: AdminCertificateRecord[]): AdminCertificateStats {
  const issued = records.filter((record) => record.hasCertificate).length;

  return {
    issued,
    notIssued: records.length - issued,
    total: records.length,
  };
}
