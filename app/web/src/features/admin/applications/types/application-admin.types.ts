import type {
  AdminOrder,
  AdminPartnerApplication,
  ApplicationAdditionalFile,
  OrderStatus,
  PartnerApplicationStatus,
  PartnerPaymentStatus,
} from "../../shared/types/admin.types";
import type { AdminStatusTone } from "../../shared/types/admin.types";

export type AdminApplicationKind = "member" | "partner";

export type AdminApplicationPaymentStatus = "not_requested" | "pending" | "paid" | "failed";

export type AdminApplicationStatusFilter =
  | "all"
  | OrderStatus
  | Lowercase<PartnerApplicationStatus>;

export type AdminApplicationFilters = {
  applicantType: "all" | AdminApplicationKind;
  paymentStatus: "all" | AdminApplicationPaymentStatus;
  status: AdminApplicationStatusFilter;
};

export type AdminApplicationRecord = {
  id: string;
  kind: AdminApplicationKind;
  applicantName: string;
  applicantEmail: string;
  applicantType: string;
  membershipPackage: string;
  status: string;
  statusLabel: string;
  statusTone: AdminStatusTone;
  paymentStatus: AdminApplicationPaymentStatus;
  paymentStatusLabel: string;
  paymentStatusTone: AdminStatusTone;
  submittedAt: string;
  isMembershipChange?: boolean;
  membershipChange?: MembershipChangeSummary | null;
  raw: AdminOrder | AdminPartnerApplication;
};

export type MembershipChangeSummary = {
  previousMembershipId: string;
  previousApplicationId: string | null;
  fromCategory: string;
  toCategory: string;
  oldAmount: number;
  newAmount: number;
  balanceDue: number;
  reason: string;
  submittedAt: string;
};

export type MemberApplicationDetail = AdminOrder;
export type PartnerApplicationDetail = AdminPartnerApplication;

export type ApplicationFieldItem = {
  label: string;
  value: string;
};

export type ApplicationFieldSection = {
  title: string;
  items: ApplicationFieldItem[];
};

export type ApplicationFileGroup = {
  title: string;
  files: string[];
};

export type ApplicationQueueResponse = {
  records: AdminApplicationRecord[];
  memberTotal: number;
  partnerTotal: number;
  hasMoreMembers: boolean;
  hasMorePartners: boolean;
};

export type { ApplicationAdditionalFile };
export type { ApplicationPromoCode } from "../../shared/types/admin.types";
export type { OrderStatus, PartnerApplicationStatus, PartnerPaymentStatus };
export type {
  AdminOrder,
  AdminOrdersResponse,
  AdminPartnerApplication,
  AdminPartnerApplicationsResponse,
} from "../../shared/types/admin.types";
