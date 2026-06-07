"use client";

import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { AdminTable } from "../../shared/components/AdminTable";
import { formatAdminDateTime } from "../../shared/utils/admin-formatters";
import type { AdminEventRegistration, EventRegistrationStatus } from "../types/event-admin.types";

type EventRegistrationsTableProps = {
  isLoading: boolean;
  registrations: AdminEventRegistration[];
};

function toneForStatus(status: EventRegistrationStatus) {
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
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
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
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">{registration.name}</span>
              <span className="text-xs text-muted-foreground">{registration.email}</span>
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
          render: (registration) => formatAdminDateTime(registration.registeredAt),
        },
        {
          key: "profile",
          label: "Profile",
          render: (registration) => (
            <Button asChild disabled={!registration.userId} size="sm" type="button" variant="ghost">
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
