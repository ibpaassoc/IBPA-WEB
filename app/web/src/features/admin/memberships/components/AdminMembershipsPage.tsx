"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { BadgeCheck, Layers, RefreshCw, TimerReset } from "lucide-react";
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

import { AdminFilters } from "../../shared/components/AdminFilters";
import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSearch } from "../../shared/components/AdminSearch";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { useAdminFilters } from "../../shared/hooks/useAdminFilters";
import { listProfiles } from "../../profiles/server/profile-admin.repository";
import { formatAdminCount } from "../../shared/utils/admin-formatters";
import {
  buildMembershipStats,
  filterMembershipRecords,
  toMembershipRecord,
} from "../server/membership-admin.service";
import type {
  AdminMembershipFilters,
  AdminMembershipRecord,
} from "../types/membership-admin.types";
import { MembershipDetailPanel } from "./MembershipDetailPanel";
import { MembershipsTable } from "./MembershipsTable";

const initialFilters: AdminMembershipFilters = {
  category: "all",
  expiry: "all",
};

export function AdminMembershipsPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const { deferredSearch, filters, resetFilters, search, setFilter, setSearch } =
    useAdminFilters<AdminMembershipFilters>(initialFilters, initialQuery);
  const [memberships, setMemberships] = useState<AdminMembershipRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<AdminMembershipRecord | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const loadMemberships = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await listProfiles({ limit: 200, q: deferredSearch });
      const nextMemberships = Array.isArray(response.items) ? response.items.map(toMembershipRecord) : [];
      setMemberships(nextMemberships);
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load memberships.");
      if (!silent) {
        setMemberships([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMemberships();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch]);

  const stats = useMemo(() => buildMembershipStats(memberships), [memberships]);
  const filteredMemberships = useMemo(
    () => filterMembershipRecords(memberships, filters),
    [filters, memberships],
  );

  const topCategory = stats.categories[0]?.category ?? "None yet";

  const summaryCards = [
    {
      description: "Members with a current, active membership",
      icon: BadgeCheck,
      key: "total",
      label: "Active memberships",
      value: stats.total.toLocaleString("en-US"),
    },
    {
      description: "Renewing within the next 60 days",
      icon: TimerReset,
      key: "expiring",
      label: "Expiring soon",
      value: stats.expiringSoon.toLocaleString("en-US"),
    },
    {
      description: `${stats.categories.length || 0} ${stats.categories.length === 1 ? "category" : "categories"} represented`,
      icon: Layers,
      key: "category",
      label: "Largest category",
      value: topCategory,
    },
  ];

  return (
    <AdminPageShell
      actions={
        <Button onClick={() => void loadMemberships()} type="button" variant="outline">
          <RefreshCw data-icon="inline-start" />
          Refresh
        </Button>
      }
      description="Track active membership categories, lifecycle status, and renewal timelines across the organization."
      lastSyncedAt={lastSyncedAt}
      title="Memberships"
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          const isHighlight = index === 0;

          return (
            <div
              className={cn(
                "flex flex-col gap-3 overflow-hidden rounded-2xl border p-5 shadow-[0_1px_2px_rgba(33,70,109,0.04),0_18px_36px_-26px_rgba(33,70,109,0.4)]",
                isHighlight
                  ? "border-transparent bg-[radial-gradient(circle_at_85%_-10%,rgba(114,160,193,0.45),transparent_46%),linear-gradient(135deg,#10203b_0%,#21466d_55%,#2b5c99_100%)] text-white"
                  : "border-border bg-card text-[#16243a]",
              )}
              key={card.key}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-[0.16em]",
                    isHighlight ? "text-white/65" : "text-[#5c7896]",
                  )}
                >
                  {card.label}
                </span>
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full",
                    isHighlight ? "bg-white/15 text-white" : "bg-[#e9f1f8] text-[#2b5c99]",
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
              </div>
              <span className="truncate text-2xl font-semibold tracking-tight">{card.value}</span>
              <span className={cn("text-sm", isHighlight ? "text-white/70" : "text-muted-foreground")}>
                {card.description}
              </span>
            </div>
          );
        })}
      </section>

      <AdminFilters>
        <AdminSearch onChange={setSearch} placeholder="Search by name, email, or certificate" value={search} />
        <Select onValueChange={(value) => setFilter("category", value)} value={filters.category}>
          <SelectTrigger className="w-full lg:w-52">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All categories</SelectItem>
              {stats.categories.map((entry) => (
                <SelectItem key={entry.category} value={entry.category}>
                  {entry.category}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => setFilter("expiry", value as AdminMembershipFilters["expiry"])}
          value={filters.expiry}
        >
          <SelectTrigger className="w-full lg:w-48">
            <SelectValue placeholder="Expiry" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All expiry windows</SelectItem>
              <SelectItem value="expiring_soon">Expiring within 60 days</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button onClick={resetFilters} type="button" variant="ghost">
          Reset
        </Button>
      </AdminFilters>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <AdminSectionCard
          description={formatAdminCount(filteredMemberships.length, "membership")}
          title="Membership directory"
        >
          <MembershipsTable
            isLoading={isLoading}
            memberships={filteredMemberships}
            onOpen={setSelected}
            selectedId={selected?.id ?? null}
          />
        </AdminSectionCard>

        <MembershipDetailPanel isLoading={false} membership={selected} />
      </div>
    </AdminPageShell>
  );
}
