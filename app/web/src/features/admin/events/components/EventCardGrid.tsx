"use client";

import { CalendarDays, Copy, MapPin, Pencil, Pin, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { formatAdminDate } from "../../shared/utils/admin-formatters";
import { getEventVisibility } from "../server/event-admin.service";
import type { AdminEvent } from "../types/event-admin.types";

type EventCardGridProps = {
  events: AdminEvent[];
  isLoading: boolean;
  selectedId?: string | null;
  onOpen: (event: AdminEvent) => void;
  onDuplicate: (event: AdminEvent) => void;
  onDelete: (event: AdminEvent) => void;
};

function EventCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card [box-shadow:var(--card-shadow)]">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function EventCardGrid({
  events,
  isLoading,
  onDelete,
  onDuplicate,
  onOpen,
  selectedId,
}: EventCardGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
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
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {events.map((event) => {
        const isSelected = event.id === selectedId;
        const visibility = getEventVisibility(event);

        return (
          <div
            className={cn(
              "group flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-200",
              "[box-shadow:var(--card-shadow)] hover:[box-shadow:var(--card-shadow-hover)]",
              isSelected ? "border-primary/40 ring-2 ring-primary/20" : "border-border",
            )}
            key={event.id}
            onClick={() => onOpen(event)}
          >
            {/* Cover image */}
            <div className="relative aspect-video overflow-hidden bg-muted">
              {event.coverImage ? (
                <img
                  alt={event.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                  src={event.coverImage}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <CalendarDays className="size-8 text-muted-foreground/30" />
                </div>
              )}
              {/* Overlay badges */}
              <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                <AdminStatusBadge
                  className="backdrop-blur-sm"
                  tone={visibility === "Published" ? "success" : "neutral"}
                >
                  {visibility}
                </AdminStatusBadge>
                {event.isPinned ? (
                  <AdminStatusBadge className="backdrop-blur-sm" tone="accent">
                    <Pin className="size-2.5" />
                    Pinned
                  </AdminStatusBadge>
                ) : null}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col gap-2 p-4">
              <h3 className="line-clamp-2 font-serif text-base font-medium leading-snug text-foreground">
                {event.title}
              </h3>

              <div className="flex flex-col gap-1">
                {event.eventDate ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="size-3 shrink-0" />
                    <span>{formatAdminDate(event.eventDate)}</span>
                  </div>
                ) : null}
                {event.eventAddress ? (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{event.eventAddress}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Actions */}
            <div
              className="flex items-center gap-1 border-t border-border px-3 py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                className="h-7 gap-1.5 px-2.5 text-xs"
                onClick={() => onOpen(event)}
                type="button"
                variant="ghost"
              >
                <Pencil className="size-3" />
                Edit
              </Button>
              <Button
                className="h-7 gap-1.5 px-2.5 text-xs"
                onClick={() => onDuplicate(event)}
                type="button"
                variant="ghost"
              >
                <Copy className="size-3" />
                Duplicate
              </Button>
              <div className="flex-1" />
              <Button
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(event)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
