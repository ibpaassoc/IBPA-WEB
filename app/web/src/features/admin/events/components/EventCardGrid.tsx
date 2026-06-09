"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import {
  CalendarDays,
  ChevronDown,
  Copy,
  Globe,
  LayoutDashboard,
  MapPin,
  Pencil,
  Pin,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { formatAdminDate } from "../../shared/utils/admin-formatters";
import { listEventRegistrations } from "../server/event-admin.repository";
import type { AdminEvent, AdminEventRegistration } from "../types/event-admin.types";
import { EventRegistrationsTable } from "./EventRegistrationsTable";

type EventCardGridProps = {
  events: AdminEvent[];
  isLoading: boolean;
  selectedId?: string | null;
  onEdit: (event: AdminEvent) => void;
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

/** Icon-only publish target indicators: active = solid blue chip, inactive = muted. */
function PublishIcons({
  publishToSite,
  publishToDashboard,
}: {
  publishToSite: boolean;
  publishToDashboard: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full transition-colors",
          publishToSite ? "bg-[#1F5D8F] text-white" : "bg-[#EEF6FF] text-[#BFD3EA]",
        )}
        title={publishToSite ? "Visible on the public site" : "Not on the public site"}
      >
        <Globe className="size-2.5" />
      </span>
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full transition-colors",
          publishToDashboard ? "bg-[#1F5D8F] text-white" : "bg-[#EEF6FF] text-[#BFD3EA]",
        )}
        title={
          publishToDashboard
            ? "Visible in the member dashboard"
            : "Not in the member dashboard"
        }
      >
        <LayoutDashboard className="size-2.5" />
      </span>
    </div>
  );
}

/**
 * Loads and renders registrations for one event.
 * `skip=true` until the card is first expanded — prevents fetching all events upfront.
 */
function EventRegistrationsPanel({
  eventId,
  skip,
}: {
  eventId: string;
  skip: boolean;
}) {
  const [registrations, setRegistrations] = useState<AdminEventRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (skip || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    setIsLoading(true);
    listEventRegistrations(eventId)
      .then((response) => {
        setRegistrations(Array.isArray(response.items) ? response.items : []);
      })
      .catch(() => {
        toast.error("Failed to load registrations.");
        setRegistrations([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [skip, eventId]);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
        Registrations
      </p>
      <EventRegistrationsTable isLoading={isLoading} registrations={registrations} />
    </div>
  );
}

export function EventCardGrid({
  events,
  isLoading,
  onDelete,
  onDuplicate,
  onEdit,
  selectedId,
}: EventCardGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = useCallback((eventId: string) => {
    setExpandedId((current) => (current === eventId ? null : eventId));
  }, []);

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
        const isExpanded = event.id === expandedId;

        return (
          <Collapsible.Root key={event.id} open={isExpanded}>
            {/* Card — click body to expand/collapse registrations */}
            <article
              className={cn(
                "group flex cursor-pointer flex-col gap-3 border bg-white p-4 transition-all duration-200 ease-out",
                isExpanded
                  ? "rounded-t-[24px] rounded-b-none border-b-0 shadow-none"
                  : "rounded-[24px] shadow-[0_18px_45px_rgba(15,46,83,0.06)] hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,46,83,0.09)]",
                isSelected ? "border-[#1F5D8F] ring-4 ring-[#1F5D8F]/10" : "border-[#D7E5F4]",
              )}
              onClick={() => toggleExpand(event.id)}
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
                      <Pin
                        aria-label="Pinned"
                        className="size-3.5 shrink-0 text-[#1F5D8F]"
                      />
                    ) : null}
                  </div>

                  <dl className="flex flex-col gap-1 text-xs text-[#6C7F95]">
                    {event.eventDate ? (
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="size-3 shrink-0 text-[#8AA2BD]" />
                        <span className="truncate tabular-nums">
                          {formatAdminDate(event.eventDate)}
                          {event.eventEndDate
                            ? ` → ${formatAdminDate(event.eventEndDate)}`
                            : ""}
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

                  <div className="mt-1">
                    <PublishIcons
                      publishToDashboard={event.publishToDashboard}
                      publishToSite={event.publishToSite}
                    />
                  </div>
                </div>
              </div>

              {/* Action row — stopPropagation so clicks here don't toggle expansion */}
              <div
                className="flex items-center border-t border-[#E4EEF8] pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  aria-label="Edit event"
                  className="size-8 rounded-full text-[#1F5D8F] hover:bg-[#EEF6FF]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(event);
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  aria-label="Duplicate event"
                  className="size-8 rounded-full text-[#55708D] hover:bg-[#EEF6FF] hover:text-[#1F5D8F]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(event);
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Copy className="size-3.5" />
                </Button>
                <div className="flex-1" />
                <button
                  aria-expanded={isExpanded}
                  aria-label={
                    isExpanded ? "Collapse registrations" : "Show registrations"
                  }
                  className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-[#8AA2BD] transition-colors hover:bg-[#EEF6FF] hover:text-[#1F5D8F]"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(event.id);
                  }}
                  type="button"
                >
                  <Users className="size-3" />
                  <ChevronDown
                    className={cn(
                      "size-3 transition-transform duration-200",
                      isExpanded && "rotate-180",
                    )}
                  />
                </button>
                <Button
                  aria-label="Delete event"
                  className="size-8 rounded-full text-[#55708D] hover:bg-[#FFF5F5] hover:text-[#B42318]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(event);
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </article>

            {/* Registrations panel — expands below the card with smooth animation */}
            <Collapsible.Content className="overflow-hidden rounded-b-[24px] border border-t-0 border-[#D7E5F4] bg-white data-[state=closed]:animate-[collapsible-up_200ms_ease] data-[state=open]:animate-[collapsible-down_220ms_ease]">
              <div className="p-4">
                <EventRegistrationsPanel eventId={event.id} skip={!isExpanded} />
              </div>
            </Collapsible.Content>
          </Collapsible.Root>
        );
      })}
    </div>
  );
}
