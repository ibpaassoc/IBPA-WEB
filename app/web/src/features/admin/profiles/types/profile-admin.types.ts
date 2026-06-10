import type { AdminClient } from "../../shared/types/admin.types";
import type { AdminStatusTone } from "../../shared/types/admin.types";

export type AdminProfileRecord = AdminClient & {
  completionScore: number;
  completionLabel: string;
  statusTone: AdminStatusTone;
};

export type AdminProfileFilters = {
  completion: "all" | "complete" | "needs_work";
  membership: "all" | string;
};

export type ProfileServiceItem = {
  id: string;
  title: string;
  description: string;
  price: string;
};

export type ProfileCertificateActionResult = {
  success?: boolean;
  certificateUrl?: string | null;
};
