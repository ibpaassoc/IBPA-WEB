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
import { cn } from "@/lib/utils";

import {
  listMemberApplications,
  listPartnerApplications,
} from "../../applications/server/application-admin.repository";
import { AdminFilters } from "../../shared/components/AdminFilters";
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
        <Button onClick={() => void loadPayments()} type="button" variant="outline">
          <RefreshCw data-icon="inline-start" />
          Refresh
        </Button>
      }
      description="A unified ledger of member and partner payments, sourced from applications and partnerships."
      lastSyncedAt={lastSyncedAt}
      title="Payments"
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          const isAccent = index === 0;

          return (
            <div
              className={cn(
                "flex flex-col gap-3 overflow-hidden rounded-2xl border p-6",
                "[box-shadow:var(--card-shadow)] transition-shadow duration-200 hover:[box-shadow:var(--card-shadow-hover)]",
                isAccent
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border bg-card",
              )}
              key={card.key}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-xs font-medium uppercase tracking-wide",
                    isAccent ? "text-primary-foreground/70" : "text-muted-foreground",
                  )}
                >
                  {card.label}
                </span>
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                    isAccent ? "bg-white/20" : "bg-primary/10",
                  )}
                >
                  <Icon className={cn("size-3.5", isAccent ? "text-white/80" : "text-primary")} />
                </span>
              </div>
              <span className={cn("font-serif text-4xl font-medium tabular-nums leading-none", isAccent ? "text-primary-foreground" : "text-foreground")}>
                {card.value.toLocaleString("en-US")}
              </span>
              <span className={cn("text-sm", isAccent ? "text-primary-foreground/70" : "text-muted-foreground")}>
                {card.description}
              </span>
            </div>
          );
        })}
      </section>

      <AdminFilters>
        <AdminSearch onChange={setSearch} placeholder="Search by payer name, email, or package" value={search} />
        <Select
          onValueChange={(value) => setFilter("source", value as AdminPaymentFilters["source"])}
          value={filters.source}
        >
          <SelectTrigger className="w-full lg:w-44">
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
          <SelectTrigger className="w-full lg:w-48">
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
        <Button onClick={resetFilters} type="button" variant="ghost">
          Reset
        </Button>
      </AdminFilters>

      <AdminSectionCard description={formatAdminCount(visiblePayments.length, "payment")} title="Payment ledger">
        <PaymentsTable isLoading={isLoading} payments={visiblePayments} />
      </AdminSectionCard>
    </AdminPageShell>
  );
}
