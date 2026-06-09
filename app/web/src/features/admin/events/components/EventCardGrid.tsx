"use client";

import { CalendarDays, Copy, Globe, LayoutDashboard, MapPin, Pencil, Pin, Trash2 } from "lucide-react";

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
    <div className="flex gap-4 overflow-hidden rounded-[24px] border border-[#D7E5F4] bg-white p-4">
      <Skeleton className="size-24 shrink-0 rounded-2xl" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

function EventThumbnail({ event }: { event: AdminEvent }) {
  if (!event.coverImage) {
    return (
      <div className="flex aspect-square size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#EEF6FF] sm:size-28">
        <CalendarDays className="size-7 text-[#BFD3EA]" strokeWidth={1.25} />
      </div>
    );
  }

  return (
    <div className="relative aspect-square size-24 shrink-0 overflow-hidden rounded-2xl bg-[#EEF6FF] sm:size-28">
      <img
        alt=""
        className="h-full w-full object-cover"
        decoding="async"
        loading="lazy"
        src={event.coverImage}
      />
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {events.map((event) => {
        const isSelected = event.id === selectedId;
        const visibility = getEventVisibility(event);

        return (
          <article
            className={cn(
              "group flex cursor-pointer flex-col gap-3 rounded-[24px] border bg-white p-4 shadow-[0_18px_45px_rgba(15,46,83,0.06)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,46,83,0.09)]",
              isSelected ? "border-[#1F5D8F] ring-4 ring-[#1F5D8F]/10" : "border-[#D7E5F4]",
            )}
            key={event.id}
            onClick={() => onOpen(event)}
          >
            <div className="flex gap-4">
              <EventThumbnail event={event} />

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-start gap-2">
                  <h3
                    className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug text-[#10203B]"
                    style={{ textWrap: "balance" }}
                  >
                    {event.title}
                  </h3>
                  {event.isPinned ? (
                    <Pin className="size-3.5 shrink-0 text-[#1F5D8F]" aria-label="Pinned" />
                  ) : null}
                </div>

                <dl className="flex flex-col gap-1 text-xs text-[#6C7F95]">
                  {event.eventDate ? (
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="size-3 shrink-0 text-[#8AA2BD]" />
                      <span className="truncate tabular-nums">
                        {formatAdminDate(event.eventDate)}
                        {event.eventEndDate ? ` → ${formatAdminDate(event.eventEndDate)}` : ""}
                      </span>
                    </div>
                  ) : null}
                  {event.eventAddress ? (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3 shrink-0 text-[#8AA2BD]" />
                      <span className="truncate">{event.eventAddress}</span>
                    </div>
                  ) : null}
                </dl>

                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <AdminStatusBadge tone={visibility === "Published" ? "success" : "neutral"}>
                    {visibility}
                  </AdminStatusBadge>
                  {event.publishToSite ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-[#D7E5F4] bg-[#F6FAFF] px-2 py-0.5 text-[10px] font-semibold text-[#55708D]"
                      title="Visible on the public site"
                    >
                      <Globe className="size-2.5" />
                      Site
                    </span>
                  ) : null}
                  {event.publishToDashboard ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-[#D7E5F4] bg-[#F6FAFF] px-2 py-0.5 text-[10px] font-semibold text-[#55708D]"
                      title="Visible in the member dashboard"
                    >
                      <LayoutDashboard className="size-2.5" />
                      Dashboard
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div
              className="flex items-center gap-1 border-t border-[#E4EEF8] pt-3"
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
                aria-label="Delete event"
                className="size-8 rounded-full text-[#55708D] hover:bg-[#FFF5F5] hover:text-[#B42318]"
                onClick={() => onDelete(event)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
