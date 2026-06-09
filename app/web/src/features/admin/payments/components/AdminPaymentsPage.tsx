"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { AlertTriangle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  listMemberApplications,
  listPartnerApplications,
} from "../../applications/server/application-admin.repository";
import { AdminFilters } from "../../shared/components/AdminFilters";
import { AdminMetricCard } from "../../shared/components/AdminMetricCard";
import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSearch } from "../../shared/components/AdminSearch";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { useAdminFilters } from "../../shared/hooks/useAdminFilters";
import { formatAdminCount } from "../../shared/utils/admin-formatters";
import {
  buildPaymentRecords,
  buildPaymentStats,
  filterPaymentRecords,
  searchPaymentRecords,
} from "../server/payment-admin.service";
import type { AdminPaymentFilters, AdminPaymentRecord } from "../types/payment-admin.types";
import { PaymentsTable } from "./PaymentsTable";

const initialFilters: AdminPaymentFilters = {
  source: "all",
  status: "all",
};

export function AdminPaymentsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const { deferredSearch, filters, resetFilters, search, setFilter, setSearch } =
    useAdminFilters<AdminPaymentFilters>(initialFilters, initialQuery);
  const [payments, setPayments] = useState<AdminPaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const loadPayments = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const [memberResult, partnerResult] = await Promise.allSettled([
        listMemberApplications({ limit: 200 }),
        listPartnerApplications({ limit: 200 }),
      ]);

      const memberOrders = memberResult.status === "fulfilled" ? memberResult.value.items : [];
      const partnerApplications = partnerResult.status === "fulfilled" ? partnerResult.value.items : [];

      if (memberResult.status === "rejected" && partnerResult.status === "rejected") {
        throw new Error("Failed to load payment records.");
      }

      setPayments(buildPaymentRecords(memberOrders, partnerApplications));
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load payments.");
      if (!silent) {
        setPayments([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPayments();
  }, []);

  const stats = useMemo(() => buildPaymentStats(payments), [payments]);

  const visiblePayments = useMemo(() => {
    const filtered = filterPaymentRecords(payments, filters);
    return searchPaymentRecords(filtered, deferredSearch);
  }, [deferredSearch, filters, payments]);

  const summaryCards = [
    {
      description: "Successfully completed transactions",
      icon: CheckCircle2,
      key: "paid",
      label: "Paid",
      value: stats.paid,
    },
    {
      description: "Awaiting payment or confirmation",
      icon: Clock,
      key: "pending",
      label: "Pending",
      value: stats.pending,
    },
    {
      description: "Declined, failed, or unpaid",
      icon: AlertTriangle,
      key: "failed",
      label: "Needs attention",
      value: stats.failed,
    },
  ];

  return (
    <AdminPageShell
      actions={
        <Button
          className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
          onClick={() => void loadPayments()}
          type="button"
          variant="outline"
        >
          <RefreshCw data-icon="inline-start" />
          Refresh
        </Button>
      }
      lastSyncedAt={lastSyncedAt}
      title="Payments"
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card, index) => (
          <AdminMetricCard
            active={index === 0}
            description={card.description}
            icon={card.icon}
            key={card.key}
            label={card.label}
            value={card.value}
          />
        ))}
      </section>

      <AdminFilters>
        <AdminSearch
          onChange={setSearch}
          placeholder="Search by payer name, email, or package"
          value={search}
        />
        <Select
          onValueChange={(value) => setFilter("source", value as AdminPaymentFilters["source"])}
          value={filters.source}
        >
          <SelectTrigger className="h-10 w-full rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B] lg:w-44">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => setFilter("status", value as AdminPaymentFilters["status"])}
          value={filters.status}
        >
          <SelectTrigger className="h-10 w-full rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B] lg:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          className="h-10 rounded-2xl px-4 text-[#1F5D8F] hover:bg-[#EEF6FF]"
          onClick={resetFilters}
          type="button"
          variant="ghost"
        >
          Reset
        </Button>
      </AdminFilters>

      <AdminSectionCard
        description={formatAdminCount(visiblePayments.length, "payment")}
        title="Payment ledger"
      >
        <PaymentsTable isLoading={isLoading} payments={visiblePayments} />
      </AdminSectionCard>
    </AdminPageShell>
  );
}
