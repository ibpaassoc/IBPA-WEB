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

function EventCardSkeleton({ feature }: { feature?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[24px] border border-[#D7E5F4] bg-white",
        feature && "md:col-span-2 md:row-span-2",
      )}
    >
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="flex flex-col gap-2 p-6">
        <Skeleton className="h-5 w-3/4" />
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
      <div className="grid auto-rows-[1fr] gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <EventCardSkeleton feature />
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
    <div className="grid auto-rows-[1fr] gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {events.map((event, index) => {
        const isSelected = event.id === selectedId;
        const visibility = getEventVisibility(event);
        const isFeature = index === 0;

        return (
          <article
            className={cn(
              "group relative flex cursor-pointer flex-col overflow-hidden rounded-[24px] border bg-white shadow-[0_18px_45px_rgba(15,46,83,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,46,83,0.09)]",
              isSelected ? "border-[#1F5D8F] ring-4 ring-[#1F5D8F]/10" : "border-[#D7E5F4]",
              isFeature && "md:col-span-2 md:row-span-2",
            )}
            key={event.id}
            onClick={() => onOpen(event)}
          >
            <div
              className={cn(
                "relative overflow-hidden bg-[#EEF6FF]",
                isFeature ? "aspect-[16/10]" : "aspect-[16/11]",
              )}
            >
              {event.coverImage ? (
                <>
                  <img
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    loading="lazy"
                    src={event.coverImage}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-[rgba(15,46,83,0.45)] via-transparent to-transparent"
                  />
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <CalendarDays className="size-10 text-[#BFD3EA]" strokeWidth={1.25} />
                </div>
              )}

              <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
                <AdminStatusBadge tone={visibility === "Published" ? "success" : "neutral"}>
                  {visibility}
                </AdminStatusBadge>
                {event.isPinned ? (
                  <AdminStatusBadge tone="info">
                    <Pin className="size-2.5" />
                    Pinned
                  </AdminStatusBadge>
                ) : null}
              </div>

              {isFeature && event.eventDate ? (
                <div className="absolute bottom-4 left-4 flex flex-col gap-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/80">
                    Save the date
                  </span>
                  <span className="text-xl font-semibold tracking-[-0.02em] text-white">
                    {formatAdminDate(event.eventDate)}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="flex flex-1 flex-col gap-3 p-6">
              <h3
                className={cn(
                  "line-clamp-2 font-semibold leading-snug tracking-[-0.01em] text-[#10203B]",
                  isFeature ? "text-xl" : "text-base",
                )}
                style={{ textWrap: "balance" }}
              >
                {event.title}
              </h3>

              <div className="flex flex-col gap-1.5">
                {!isFeature && event.eventDate ? (
                  <div className="flex items-center gap-2 text-xs text-[#6C7F95]">
                    <CalendarDays className="size-3.5 shrink-0 text-[#8AA2BD]" />
                    <span className="tabular-nums">{formatAdminDate(event.eventDate)}</span>
                  </div>
                ) : null}
                {event.eventAddress ? (
                  <div className="flex items-center gap-2 text-xs text-[#6C7F95]">
                    <MapPin className="size-3.5 shrink-0 text-[#8AA2BD]" />
                    <span className="truncate">{event.eventAddress}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex-1" />

              <div
                className="-mb-1 flex items-center gap-1 border-t border-[#E4EEF8] pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  className="h-8 gap-1.5 rounded-full px-3 text-xs text-[#1F5D8F] hover:bg-[#EEF6FF]"
                  onClick={() => onOpen(event)}
                  type="button"
                  variant="ghost"
                >
                  <Pencil className="size-3" />
                  Edit
                </Button>
                <Button
                  className="h-8 gap-1.5 rounded-full px-3 text-xs text-[#55708D] hover:bg-[#EEF6FF] hover:text-[#1F5D8F]"
                  onClick={() => onDuplicate(event)}
                  type="button"
                  variant="ghost"
                >
                  <Copy className="size-3" />
                  Duplicate
                </Button>
                <div className="flex-1" />
                <Button
                  className="size-8 rounded-full text-[#55708D] hover:bg-[#FFF5F5] hover:text-[#B42318]"
                  onClick={() => onDelete(event)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
