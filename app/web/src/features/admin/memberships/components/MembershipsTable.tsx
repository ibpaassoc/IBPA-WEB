"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { AdminTable } from "../../shared/components/AdminTable";
import { formatAdminDate, initialsFromName } from "../../shared/utils/admin-formatters";
import type { AdminMembershipRecord } from "../types/membership-admin.types";

type MembershipsTableProps = {
  isLoading: boolean;
  memberships: AdminMembershipRecord[];
  onOpen: (membership: AdminMembershipRecord) => void;
  selectedId?: string | null;
};

export function MembershipsTable({
  isLoading,
  memberships,
  onOpen,
  selectedId,
}: MembershipsTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton className="h-14 w-full" key={index} />
        ))}
      </div>
    );
  }

  if (memberships.length === 0) {
    return (
      <AdminEmptyState
        description="Try another search or filter."
        title="No memberships found"
      />
    );
  }

  return (
    <AdminTable
      columns={[
        {
          key: "member",
          label: "Member",
          render: (membership) => (
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src={membership.avatarUrl || undefined} />
                <AvatarFallback>{initialsFromName(membership.userName)}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium text-foreground">{membership.userName}</span>
                <span className="truncate text-xs text-muted-foreground">{membership.email}</span>
              </div>
            </div>
          ),
        },
        {
          key: "category",
          label: "Category",
          render: (membership) => membership.cardName || membership.membershipCategory || "Member",
        },
        {
          key: "status",
          label: "Status",
          render: (membership) => <AdminStatusBadge tone="success">{membership.status || "Active"}</AdminStatusBadge>,
        },
        {
          key: "since",
          label: "Member since",
          render: (membership) => formatAdminDate(membership.createdAt),
        },
        {
          key: "expiry",
          label: "Expiry",
          render: (membership) => (
            <AdminStatusBadge tone={membership.expiryTone}>{membership.expiryLabel}</AdminStatusBadge>
          ),
        },
      ]}
      getRowKey={(membership) => membership.id}
      items={memberships}
      onRowClick={onOpen}
      selectedKey={selectedId}
    />
  );
}
