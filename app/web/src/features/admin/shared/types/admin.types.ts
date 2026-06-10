export type AdminStatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "accent";

export type AdminNavItem = {
  href: string;
  label: string;
  description?: string;
};

export type AdminFilterOption<TValue extends string = string> = {
  value: TValue;
  label: string;
};

export type AdminTableColumn<TItem> = {
  key: string;
  label: string;
  className?: string;
  render: (item: TItem) => ReactNode;
};

export type AdminListState = "loading" | "ready" | "empty" | "error";

export type {
  AdminCardsResponse,
  AdminClient,
  AdminContentItem,
  AdminListResponse,
  AdminOrder,
  AdminOrderSummary,
  AdminOrdersResponse,
  AdminPartnerApplication,
  AdminPartnerApplicationsResponse,
  AdminPartnerApplicationsSummary,
  ApplicationAdditionalFile,
  ApplicationPayload,
  OrderStatus,
  PartnerApplicationStatus,
  PartnerPaymentStatus,
} from "@/lib/admin-types";
import type { ReactNode } from "react";
