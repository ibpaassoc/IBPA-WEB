"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { BadgeCheck, Layers, RefreshCw, TimerReset } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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

import { AdminFilters } from "../../shared/components/AdminFilters";
import { AdminMetricCard } from "../../shared/components/AdminMetricCard";
import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSearch } from "../../shared/components/AdminSearch";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { useAdminFilters } from "../../shared/hooks/useAdminFilters";
import { useDebouncedValue } from "../../shared/hooks/useDebouncedValue";
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
  const listRequestRef = useRef(0);
  const searchTerm = useDebouncedValue(deferredSearch);

  const loadMemberships = async ({ silent = false }: { silent?: boolean } = {}) => {
    const requestId = ++listRequestRef.current;
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await listProfiles({ limit: 200, q: searchTerm });
      if (requestId !== listRequestRef.current) return;
      const nextMemberships = Array.isArray(response.items) ? response.items.map(toMembershipRecord) : [];
      setMemberships(nextMemberships);
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      if (requestId !== listRequestRef.current) return;
      toast.error(error instanceof Error ? error.message : "Failed to load memberships.");
      if (!silent) {
        setMemberships([]);
      }
    } finally {
      if (requestId === listRequestRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadMemberships();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

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
      value: stats.total,
    },
    {
      description: "Renewing within the next 60 days",
      icon: TimerReset,
      key: "expiring",
      label: "Expiring soon",
      value: stats.expiringSoon,
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
        <Button
          className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
          onClick={() => void loadMemberships()}
          type="button"
          variant="outline"
        >
          <RefreshCw data-icon="inline-start" />
          Refresh
        </Button>
      }
      description="Track active membership categories, lifecycle status, and renewal timelines across the organization."
      lastSyncedAt={lastSyncedAt}
      title="Memberships"
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
        <AdminSearch onChange={setSearch} placeholder="Search by name, email, or certificate" value={search} />
        <Select onValueChange={(value) => setFilter("category", value)} value={filters.category}>
          <SelectTrigger className="h-10 w-full rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B] lg:w-52">
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
          <SelectTrigger className="h-10 w-full rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B] lg:w-48">
            <SelectValue placeholder="Expiry" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All expiry windows</SelectItem>
              <SelectItem value="expiring_soon">Expiring within 60 days</SelectItem>
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
