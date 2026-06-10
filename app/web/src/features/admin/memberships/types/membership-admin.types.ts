import type { AdminClient, AdminStatusTone } from "../../shared/types/admin.types";

export type AdminMembershipExpiryFilter = "all" | "expiring_soon";

export type AdminMembershipFilters = {
  category: "all" | string;
  expiry: AdminMembershipExpiryFilter;
};

export type AdminMembershipRecord = AdminClient & {
  daysUntilExpiry: number | null;
  expiryLabel: string;
  expiryTone: AdminStatusTone;
};

export type AdminMembershipCategoryBreakdown = {
  category: string;
  count: number;
};

export type AdminMembershipStats = {
  categories: AdminMembershipCategoryBreakdown[];
  expiringSoon: number;
  total: number;
};
