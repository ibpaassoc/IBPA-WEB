"use client";

import { Copy, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { AdminTable } from "../../shared/components/AdminTable";
import { formatAdminDate } from "../../shared/utils/admin-formatters";
import { getEventVisibility } from "../server/event-admin.service";
import type { AdminEvent } from "../types/event-admin.types";

type EventsTableProps = {
  events: AdminEvent[];
  isLoading: boolean;
  onDelete: (event: AdminEvent) => void;
  onDuplicate: (event: AdminEvent) => void;
  onOpen: (event: AdminEvent) => void;
  selectedId?: string | null;
};

export function EventsTable({
  events,
  isLoading,
  onDelete,
  onDuplicate,
  onOpen,
  selectedId,
}: EventsTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton className="h-14 w-full" key={index} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <AdminEmptyState
        description="Add an event or change the current filters."
        title="No events found"
      />
    );
  }

  return (
    <AdminTable
      columns={[
        {
          key: "event",
          label: "Event",
          render: (event) => (
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">{event.title}</span>
              <span className="text-xs text-muted-foreground">{event.eventAddress || "Location not set"}</span>
            </div>
          ),
        },
        {
          key: "date",
          label: "Date",
          render: (event) => formatAdminDate(event.eventDate),
        },
        {
          key: "status",
          label: "Status",
          render: (event) => (
            <AdminStatusBadge tone={getEventVisibility(event) === "Published" ? "success" : "neutral"}>
              {getEventVisibility(event)}
            </AdminStatusBadge>
          ),
        },
        {
          key: "actions",
          label: "Actions",
          render: (event) => (
            <div className="flex justify-end gap-1">
              <Button onClick={() => onOpen(event)} size="icon-sm" type="button" variant="ghost">
                <Pencil data-icon="inline-start" />
              </Button>
              <Button onClick={() => onDuplicate(event)} size="icon-sm" type="button" variant="ghost">
                <Copy data-icon="inline-start" />
              </Button>
              <Button onClick={() => onDelete(event)} size="icon-sm" type="button" variant="ghost">
                <Trash2 data-icon="inline-start" />
              </Button>
            </div>
          ),
        },
      ]}
      getRowKey={(event) => event.id}
      items={events}
      onRowClick={onOpen}
      selectedKey={selectedId}
    />
  );
}
