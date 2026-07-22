import type { AdminClient, AdminStatusTone } from "../../shared/types/admin.types";

export type MemberTab = "profile" | "membership" | "certificate";

export type AdminMemberFilters = {
  membership: "all" | string;
  certificate: "all" | "issued" | "not_issued";
};

// Admin-uploaded additional certificate, as returned by the admin proxy API.
// The UploadThing storage key is intentionally never exposed to the browser.
export type AdminCertificateRecord = {
  id: string;
  title: string;
  fileUrl: string;
  fileName: string | null;
  fileType: string | null;
  issuedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminMemberRecord = AdminClient & {
  // membership
  daysUntilExpiry: number | null;
  expiryLabel: string;
  expiryTone: AdminStatusTone;
  // certificate
  hasCertificate: boolean;
  certStatusLabel: string;
  certStatusTone: AdminStatusTone;
  // access
  isLinked: boolean;
};
