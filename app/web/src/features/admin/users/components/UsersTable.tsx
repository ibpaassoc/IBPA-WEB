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
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
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
              <Avatar className="size-9">
                <AvatarImage src={user.avatarUrl || undefined} />
                <AvatarFallback>{initialsFromName(user.userName)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium text-foreground">{user.userName}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
            </div>
          ),
        },
        {
          key: "membership",
          label: "Membership",
          render: (user) => user.cardName || user.membershipCategory || "Member",
        },
        {
          key: "access",
          label: "Dashboard access",
          render: (user) => <AdminStatusBadge tone={user.accessTone}>{user.accessLabel}</AdminStatusBadge>,
        },
        {
          key: "since",
          label: "Member since",
          render: (user) => formatAdminDate(user.createdAt),
        },
      ]}
      getRowKey={(user) => user.id}
      items={users}
      onRowClick={onOpen}
      selectedKey={selectedId}
    />
  );
}
