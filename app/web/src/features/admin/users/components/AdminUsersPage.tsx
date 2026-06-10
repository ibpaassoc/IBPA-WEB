"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { Link2, RefreshCw, UserCog, UserX } from "lucide-react";
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

import { AdminFilters } from "../../shared/components/AdminFilters";
import { AdminMetricCard } from "../../shared/components/AdminMetricCard";
import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSearch } from "../../shared/components/AdminSearch";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { useAdminFilters } from "../../shared/hooks/useAdminFilters";
import { listProfiles } from "../../profiles/server/profile-admin.repository";
import { formatAdminCount } from "../../shared/utils/admin-formatters";
import { buildUserStats, filterUserRecords, toUserRecord } from "../server/user-admin.service";
import type { AdminUserFilters, AdminUserRecord } from "../types/user-admin.types";
import { UserDetailPanel } from "./UserDetailPanel";
import { UsersTable } from "./UsersTable";

const initialFilters: AdminUserFilters = {
  access: "all",
  membership: "all",
};

export function AdminUsersPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const { deferredSearch, filters, resetFilters, search, setFilter, setSearch } =
    useAdminFilters<AdminUserFilters>(initialFilters, initialQuery);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<AdminUserRecord | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const loadUsers = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const response = await listProfiles({ limit: 200, q: deferredSearch });
      const nextUsers = Array.isArray(response.items) ? response.items.map(toUserRecord) : [];
      setUsers(nextUsers);
      setCategories(Array.isArray(response.categories) ? response.categories : []);
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load users.");
      if (!silent) {
        setUsers([]);
        setCategories([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch]);

  const stats = useMemo(() => buildUserStats(users), [users]);
  const filteredUsers = useMemo(() => filterUserRecords(users, filters), [filters, users]);

  const summaryCards = [
    {
      description: "Accounts with linked dashboard access",
      icon: Link2,
      key: "linked",
      label: "Dashboard linked",
      value: stats.linked,
    },
    {
      description: "Active members without a linked account",
      icon: UserX,
      key: "not-linked",
      label: "Not linked",
      value: stats.notLinked,
    },
    {
      description: "Active membership accounts reviewed",
      icon: UserCog,
      key: "total",
      label: "Total accounts",
      value: stats.total,
    },
  ];

  return (
    <AdminPageShell
      actions={
        <Button
          className="h-10 rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
          onClick={() => void loadUsers()}
          type="button"
          variant="outline"
        >
          <RefreshCw data-icon="inline-start" />
          Refresh
        </Button>
      }
      description="Review member accounts, their linked dashboard profiles, and access status — separate from profile content."
      lastSyncedAt={lastSyncedAt}
      title="Users"
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
        <AdminSearch onChange={setSearch} placeholder="Search by name, email, or membership" value={search} />
        <Select onValueChange={(value) => setFilter("membership", value)} value={filters.membership}>
          <SelectTrigger className="h-10 w-full rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B] lg:w-52">
            <SelectValue placeholder="Membership" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All memberships</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(value) => setFilter("access", value as AdminUserFilters["access"])}
          value={filters.access}
        >
          <SelectTrigger className="h-10 w-full rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B] lg:w-48">
            <SelectValue placeholder="Dashboard access" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">All accounts</SelectItem>
              <SelectItem value="linked">Dashboard linked</SelectItem>
              <SelectItem value="not_linked">Not linked</SelectItem>
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
          description={formatAdminCount(filteredUsers.length, "account")}
          title="User directory"
        >
          <UsersTable
            isLoading={isLoading}
            onOpen={setSelected}
            selectedId={selected?.id ?? null}
            users={filteredUsers}
          />
        </AdminSectionCard>

        <UserDetailPanel user={selected} />
      </div>
    </AdminPageShell>
  );
}
