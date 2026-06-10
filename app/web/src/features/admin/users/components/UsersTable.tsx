"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { AdminTable } from "../../shared/components/AdminTable";
import { formatAdminDate, initialsFromName } from "../../shared/utils/admin-formatters";
import type { AdminUserRecord } from "../types/user-admin.types";

type UsersTableProps = {
  isLoading: boolean;
  onOpen: (user: AdminUserRecord) => void;
  selectedId?: string | null;
  users: AdminUserRecord[];
};

export function UsersTable({ isLoading, onOpen, selectedId, users }: UsersTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 rounded-[24px] border border-[#D7E5F4] bg-white p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton className="h-14 w-full" key={index} />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <AdminEmptyState
        description="Try another search or filter."
        title="No user accounts found"
      />
    );
  }

  return (
    <AdminTable
      columns={[
        {
          key: "user",
          label: "User",
          render: (user) => (
            <div className="flex items-center gap-3">
              <Avatar className="size-9 border border-[#D7E5F4]">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback className="bg-[#EEF6FF] text-xs font-semibold text-[#1F5D8F]">
                  {initialsFromName(user.userName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-semibold text-[#10203B]">{user.userName}</span>
                <span className="truncate text-xs text-[#6C7F95]">{user.email}</span>
              </div>
            </div>
          ),
        },
        {
          key: "membership",
          label: "Membership",
          render: (user) => (
            <span className="text-sm text-[#10203B]">
              {user.cardName || user.membershipCategory || "Member"}
            </span>
          ),
        },
        {
          key: "access",
          label: "Dashboard access",
          render: (user) => <AdminStatusBadge tone={user.accessTone}>{user.accessLabel}</AdminStatusBadge>,
        },
        {
          key: "since",
          label: "Member since",
          render: (user) => (
            <span className="text-xs text-[#6C7F95]">{formatAdminDate(user.createdAt)}</span>
          ),
        },
      ]}
      getRowKey={(user) => user.id}
      items={users}
      onRowClick={onOpen}
      selectedKey={selectedId}
    />
  );
}
