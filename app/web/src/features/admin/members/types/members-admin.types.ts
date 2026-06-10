import type { AdminClient, AdminStatusTone } from "../../shared/types/admin.types";

export type MemberTab = "profile" | "membership" | "certificate";

export type AdminMemberFilters = {
  membership: "all" | string;
  certificate: "all" | "issued" | "not_issued";
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
