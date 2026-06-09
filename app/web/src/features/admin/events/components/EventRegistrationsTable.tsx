"use client";

import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { AdminTable } from "../../shared/components/AdminTable";
import type { AdminStatusTone } from "../../shared/types/admin.types";
import { formatAdminDateTime } from "../../shared/utils/admin-formatters";
import type { AdminEventRegistration, EventRegistrationStatus } from "../types/event-admin.types";

type EventRegistrationsTableProps = {
  isLoading: boolean;
  registrations: AdminEventRegistration[];
};

function toneForStatus(status: EventRegistrationStatus): AdminStatusTone {
  switch (status) {
    case "ATTENDED":
      return "success";
    case "CANCELLED":
      return "danger";
    case "WAITLISTED":
      return "warning";
    case "REGISTERED":
    default:
      return "info";
  }
}

export function EventRegistrationsTable({
  isLoading,
  registrations,
}: EventRegistrationsTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 rounded-[24px] border border-[#D7E5F4] bg-white p-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <AdminEmptyState
        description="Registration rows appear here once members register from the dashboard."
        title="No registrations"
      />
    );
  }

  return (
    <AdminTable
      columns={[
        {
          key: "name",
          label: "Registrant",
          render: (registration) => (
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-[#10203B]">{registration.name}</span>
              <span className="text-xs text-[#6C7F95]">{registration.email}</span>
            </div>
          ),
        },
        {
          key: "status",
          label: "Status",
          render: (registration) => (
            <AdminStatusBadge tone={toneForStatus(registration.status)}>
              {registration.status.toLowerCase()}
            </AdminStatusBadge>
          ),
        },
        {
          key: "registered",
          label: "Registered",
          render: (registration) => (
            <span className="text-xs text-[#6C7F95]">
              {formatAdminDateTime(registration.registeredAt)}
            </span>
          ),
        },
        {
          key: "profile",
          label: "Profile",
          render: (registration) => (
            <Button
              asChild
              className="h-8 rounded-full px-3 text-xs text-[#1F5D8F] hover:bg-[#EEF6FF]"
              disabled={!registration.userId}
              size="sm"
              type="button"
              variant="ghost"
            >
              <a href={`/profile-preview/${registration.userId}`} rel="noreferrer" target="_blank">
                <ExternalLink data-icon="inline-start" />
                Open
              </a>
            </Button>
          ),
        },
      ]}
      getRowKey={(registration) => registration.id}
      items={registrations}
    />
  );
}
