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

/**
 * Always returns a displayable price label.
 * - null / undefined / "" / "0" / 0  →  "Free"
 * - 50 (number)                       →  "$50"
 * - "50" (bare numeric string)        →  "$50"
 * - "$50" / "Members: $10"            →  as-is
 */
function formatEventPrice(price?: string | number | null): string {
  if (price == null) return "Free";

  if (typeof price === "number") {
    return price === 0 ? "Free" : `$${price}`;
  }

  const trimmed = price.trim();
  if (!trimmed || trimmed === "0") return "Free";

  // Plain integer/decimal without a currency symbol → prefix with $
  if (/^\d+(\.\d{1,2})?$/.test(trimmed)) return `$${trimmed}`;

  return trimmed;
}

function EventCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 overflow-hidden rounded-[24px] border border-[#D7E5F4] bg-white p-4">
      <div className="flex gap-3">
        <Skeleton className="size-20 shrink-0 rounded-2xl sm:size-24" />
        <div className="flex flex-1 flex-col gap-2 pt-0.5">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
          <Skeleton className="mt-1 h-5 w-16 rounded-full" />
        </div>
      </div>
      <div className="flex gap-2 border-t border-[#E4EEF8] pt-3">
        <Skeleton className="size-7 rounded-full" />
        <Skeleton className="size-7 rounded-full" />
        <div className="flex-1" />
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="size-7 rounded-full" />
      </div>
    </div>
  );
}

function EventThumbnail({ event }: { event: AdminEvent }) {
  if (!event.coverImage) {
    return (
      <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#EEF6FF] sm:size-24">
        <CalendarDays className="size-6 text-[#BFD3EA]" strokeWidth={1.25} />
      </div>
    );
  }

  return (
    <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-[#EEF6FF] sm:size-24">
      {/* eslint-disable-next-line @next/next/no-img-element */}
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

/** Icon-only publish target indicators: filled blue = active, muted = inactive. */
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
          "flex size-[18px] items-center justify-center rounded-full transition-colors",
          publishToSite ? "bg-[#1F5D8F] text-white" : "bg-[#EEF6FF] text-[#BFD3EA]",
        )}
        title={publishToSite ? "Visible on public site" : "Not on public site"}
      >
        <Globe className="size-2.5" />
      </span>
      <span
        className={cn(
          "flex size-[18px] items-center justify-center rounded-full transition-colors",
          publishToDashboard ? "bg-[#1F5D8F] text-white" : "bg-[#EEF6FF] text-[#BFD3EA]",
        )}
        title={
          publishToDashboard ? "Visible in member dashboard" : "Not in member dashboard"
        }
      >
        <LayoutDashboard className="size-2.5" />
      </span>
    </div>
  );
}

/**
 * Loads registrations on first expand.
 * `skip=true` keeps it dormant until the card is opened for the first time.
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
      <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
    // items-start: each card is its own natural height — expanding one card
    // does not stretch its siblings in the same grid row.
    <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {events.map((event) => {
        const isSelected = event.id === selectedId;
        const isExpanded = event.id === expandedId;
        const priceLabel = formatEventPrice(event.price);
        const isFree = priceLabel === "Free";

        return (
          <Collapsible.Root key={event.id} open={isExpanded}>

            {/* ── Card ─────────────────────────────────────────────────── */}
            <article
              className={cn(
                "group flex cursor-pointer flex-col border bg-white transition-all duration-200 ease-out",
                isExpanded
                  ? "rounded-t-[24px] rounded-b-none border-b-0 shadow-none"
                  : "rounded-[24px] shadow-[0_2px_12px_rgba(15,46,83,0.07)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(15,46,83,0.11)]",
                isSelected
                  ? "border-[#1F5D8F] ring-2 ring-[#1F5D8F]/15"
                  : "border-[#D7E5F4]",
              )}
              onClick={() => toggleExpand(event.id)}
            >
              {/* Top content */}
              <div className="flex gap-3 p-4 pb-3">
                <EventThumbnail event={event} />

                <div className="flex min-w-0 flex-1 flex-col gap-2">

                  {/* Title + pin */}
                  <div className="flex items-start gap-1.5">
                    <h3 className="line-clamp-2 min-w-0 flex-1 text-[13px] font-semibold leading-snug text-[#10203B]">
                      {event.title}
                    </h3>
                    {event.isPinned ? (
                      <Pin
                        aria-label="Pinned"
                        className="mt-0.5 size-3 shrink-0 text-[#1F5D8F]"
                      />
                    ) : null}
                  </div>

                  {/* Date + location meta */}
                  <dl className="flex flex-col gap-1">
                    {event.eventDate ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#6C7F95]">
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
                      <div className="flex items-center gap-1.5 text-[11px] text-[#6C7F95]">
                        <MapPin className="size-3 shrink-0 text-[#8AA2BD]" />
                        <span className="truncate">{event.eventAddress}</span>
                      </div>
                    ) : null}
                  </dl>

                  {/* Publish icons + price pill */}
                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <PublishIcons
                      publishToDashboard={event.publishToDashboard}
                      publishToSite={event.publishToSite}
                    />
                    {isFree ? (
                      <span className="inline-flex items-center rounded-full border border-[#E4EEF8] bg-[#F6FAFF] px-2 py-0.5 text-[10px] italic text-[#A0B4C8]">
                        Free
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#1F5D8F] px-2.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
                        {priceLabel}
                      </span>
                    )}
                  </div>

                </div>
              </div>

              {/* ── Action row ─────────────────────────────────────────── */}
              <div
                className="flex items-center gap-0.5 border-t border-[#E4EEF8] px-3 py-2"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Edit */}
                <Button
                  aria-label="Edit event"
                  className="size-8 rounded-full text-[#55708D] hover:bg-[#EEF6FF] hover:text-[#1F5D8F]"
                  onClick={(e) => { e.stopPropagation(); onEdit(event); }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Pencil className="size-3.5" />
                </Button>

                {/* Duplicate */}
                <Button
                  aria-label="Duplicate event"
                  className="size-8 rounded-full text-[#55708D] hover:bg-[#EEF6FF] hover:text-[#1F5D8F]"
                  onClick={(e) => { e.stopPropagation(); onDuplicate(event); }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Copy className="size-3.5" />
                </Button>

                <div className="flex-1" />

                {/* Registrations toggle */}
                <button
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? "Collapse registrations" : "Show registrations"}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium text-[#8AA2BD] transition-colors hover:bg-[#EEF6FF] hover:text-[#1F5D8F]"
                  onClick={(e) => { e.stopPropagation(); toggleExpand(event.id); }}
                  type="button"
                >
                  <Users className="size-3" />
                  <span>Registrations</span>
                  <ChevronDown
                    className={cn(
                      "size-3 transition-transform duration-200",
                      isExpanded && "rotate-180",
                    )}
                  />
                </button>

                {/* Delete */}
                <Button
                  aria-label="Delete event"
                  className="size-8 rounded-full text-[#55708D] hover:bg-[#FFF3F3] hover:text-[#B42318]"
                  onClick={(e) => { e.stopPropagation(); onDelete(event); }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </article>

            {/* ── Registrations panel ───────────────────────────────────── */}
            <Collapsible.Content className="overflow-hidden rounded-b-[24px] border border-t-0 border-[#D7E5F4] bg-white data-[state=closed]:animate-[collapsible-up_200ms_ease] data-[state=open]:animate-[collapsible-down_220ms_ease]">
              <div className="p-4 pt-3">
                <EventRegistrationsPanel eventId={event.id} skip={!isExpanded} />
              </div>
            </Collapsible.Content>

          </Collapsible.Root>
        );
      })}
    </div>
  );
}
