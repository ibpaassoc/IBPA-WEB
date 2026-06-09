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
import { cn } from "@/lib/utils";

import { AdminFilters } from "../../shared/components/AdminFilters";
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
        <Button onClick={() => void loadUsers()} type="button" variant="outline">
          <RefreshCw data-icon="inline-start" />
          Refresh
        </Button>
      }
      description="Review member accounts, their linked dashboard profiles, and access status — separate from profile content."
      lastSyncedAt={lastSyncedAt}
      title="Users"
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
              <span className="text-3xl font-semibold tracking-tight">{card.value.toLocaleString("en-US")}</span>
              <span className={cn("text-sm", isHighlight ? "text-white/70" : "text-muted-foreground")}>
                {card.description}
              </span>
            </div>
          );
        })}
      </section>

      <AdminFilters>
        <AdminSearch onChange={setSearch} placeholder="Search by name, email, or membership" value={search} />
        <Select onValueChange={(value) => setFilter("membership", value)} value={filters.membership}>
          <SelectTrigger className="w-full lg:w-52">
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
          <SelectTrigger className="w-full lg:w-48">
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
        <Button onClick={resetFilters} type="button" variant="ghost">
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
