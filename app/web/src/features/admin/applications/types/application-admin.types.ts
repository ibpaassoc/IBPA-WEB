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
  raw: AdminOrder | AdminPartnerApplication;
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
export type { OrderStatus, PartnerApplicationStatus, PartnerPaymentStatus };
export type {
  AdminOrder,
  AdminOrdersResponse,
  AdminPartnerApplication,
  AdminPartnerApplicationsResponse,
} from "../../shared/types/admin.types";
