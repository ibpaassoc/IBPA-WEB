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
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
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
            <Link className="flex flex-col gap-0.5 hover:underline" href={payment.href}>
              <span className="truncate font-medium text-foreground">{payment.payerName}</span>
              <span className="truncate text-xs text-muted-foreground">{payment.payerEmail}</span>
            </Link>
          ),
        },
        {
          key: "source",
          label: "Source",
          render: (payment) => <AdminStatusBadge tone="info">{payment.sourceLabel}</AdminStatusBadge>,
        },
        {
          key: "package",
          label: "Package",
          render: (payment) => payment.packageLabel,
        },
        {
          key: "status",
          label: "Payment status",
          render: (payment) => <AdminStatusBadge tone={payment.statusTone}>{payment.statusLabel}</AdminStatusBadge>,
        },
        {
          key: "date",
          label: "Date",
          render: (payment) => payment.dateLabel,
        },
      ]}
      getRowKey={(payment) => payment.id}
      items={payments}
    />
  );
}
