import type { AdminClient, AdminStatusTone } from "../../shared/types/admin.types";

export type AdminUserAccessFilter = "all" | "linked" | "not_linked";

export type AdminUserFilters = {
  access: AdminUserAccessFilter;
  membership: "all" | string;
};

export type AdminUserRecord = AdminClient & {
  accessLabel: string;
  accessTone: AdminStatusTone;
};

export type AdminUserStats = {
  linked: number;
  notLinked: number;
  total: number;
};
