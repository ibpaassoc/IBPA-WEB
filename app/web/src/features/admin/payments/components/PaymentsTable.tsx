"use client";

import Link from "next/link";

import { Skeleton } from "@/components/ui/skeleton";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { AdminTable } from "../../shared/components/AdminTable";
import type { AdminPaymentRecord } from "../types/payment-admin.types";

type PaymentsTableProps = {
  isLoading: boolean;
  payments: AdminPaymentRecord[];
};

export function PaymentsTable({ isLoading, payments }: PaymentsTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 rounded-[24px] border border-[#D7E5F4] bg-white p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton className="h-14 w-full" key={index} />
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <AdminEmptyState
        description="Try another search or filter."
        title="No payments found"
      />
    );
  }

  return (
    <AdminTable
      columns={[
        {
          key: "payer",
          label: "Payer",
          render: (payment) => (
            <Link
              className="flex flex-col gap-0.5 transition-colors hover:text-[#1F5D8F]"
              href={payment.href}
            >
              <span className="truncate font-semibold text-[#10203B]">{payment.payerName}</span>
              <span className="truncate text-xs text-[#6C7F95]">{payment.payerEmail}</span>
            </Link>
          ),
        },
        {
          key: "source",
          label: "Source",
          render: (payment) => (
            <AdminStatusBadge tone="info">{payment.sourceLabel}</AdminStatusBadge>
          ),
        },
        {
          key: "package",
          label: "Package",
          render: (payment) => (
            <span className="text-sm text-[#10203B]">{payment.packageLabel}</span>
          ),
        },
        {
          key: "status",
          label: "Payment status",
          render: (payment) => (
            <AdminStatusBadge tone={payment.statusTone}>{payment.statusLabel}</AdminStatusBadge>
          ),
        },
        {
          key: "date",
          label: "Date",
          render: (payment) => (
            <span className="text-xs text-[#6C7F95]">{payment.dateLabel}</span>
          ),
        },
      ]}
      getRowKey={(payment) => payment.id}
      items={payments}
    />
  );
}
