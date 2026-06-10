"use client";

import { Skeleton } from "@/components/ui/skeleton";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { AdminTable } from "../../shared/components/AdminTable";
import { formatAdminDate } from "../../shared/utils/admin-formatters";
import type { AdminProfileRecord } from "../types/profile-admin.types";

type ProfilesTableProps = {
  profiles: AdminProfileRecord[];
  isLoading: boolean;
  onOpen: (profile: AdminProfileRecord) => void;
  selectedId?: string | null;
};

export function ProfilesTable({
  isLoading,
  onOpen,
  profiles,
  selectedId,
}: ProfilesTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton className="h-14 w-full" key={index} />
        ))}
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <AdminEmptyState
        description="Try another search or filter."
        title="No profiles found"
      />
    );
  }

  return (
    <AdminTable
      columns={[
        {
          key: "member",
          label: "Profile",
          render: (profile) => (
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">{profile.userName}</span>
              <span className="text-xs text-muted-foreground">{profile.email}</span>
            </div>
          ),
        },
        {
          key: "membership",
          label: "Membership",
          render: (profile) => profile.cardName || profile.membershipCategory || "Member",
        },
        {
          key: "completion",
          label: "Completion",
          render: (profile) => (
            <AdminStatusBadge tone={profile.statusTone}>{profile.completionScore}%</AdminStatusBadge>
          ),
        },
        {
          key: "certificate",
          label: "Certificate",
          render: (profile) => profile.certificateNumber || "Not issued",
        },
        {
          key: "memberSince",
          label: "Member since",
          render: (profile) => formatAdminDate(profile.createdAt),
        },
      ]}
      getRowKey={(profile) => profile.id}
      items={profiles}
      onRowClick={onOpen}
      selectedKey={selectedId}
    />
  );
}
