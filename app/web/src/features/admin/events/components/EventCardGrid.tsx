"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import {
  ChevronDown,
  Copy,
  Globe,
  LayoutDashboard,
  Pencil,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { EventCard } from "@/components/content/EventCard";
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
            <EventCard
              className={cn(
                "transition-all duration-200 ease-out",
                isExpanded ? "rounded-b-none border-b-0 shadow-none" : "hover:-translate-y-0.5",
                isSelected
                  ? "border-[#1F5D8F] ring-2 ring-[#1F5D8F]/15"
                  : "border-[#D7E5F4]",
              )}
              event={{
                title: event.title,
                coverImage: event.coverImage,
                coverAspect: event.coverAspect ?? event.cover_aspect,
                imageMetadata: event.imageMetadata,
                eyebrow: event.isPinned ? "Pinned" : null,
              }}
              imageSizes="112px"
              meta={[
                ...(event.eventDate
                  ? [{
                      kind: "date" as const,
                      value: `${formatAdminDate(event.eventDate)}${
                        event.eventEndDate ? ` → ${formatAdminDate(event.eventEndDate)}` : ""
                      }`,
                    }]
                  : []),
                ...(event.eventAddress
                  ? [{ kind: "location" as const, value: event.eventAddress }]
                  : []),
              ]}
              badges={
                <div className="flex flex-wrap items-center gap-2">
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
              }
              footer={
                <div className="flex items-center gap-0.5">
                <Button
                  aria-label="Edit event"
                  className="size-8 rounded-full text-[#55708D] hover:bg-[#EEF6FF] hover:text-[#1F5D8F]"
                  onClick={() => onEdit(event)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Pencil className="size-3.5" />
                </Button>

                <Button
                  aria-label="Duplicate event"
                  className="size-8 rounded-full text-[#55708D] hover:bg-[#EEF6FF] hover:text-[#1F5D8F]"
                  onClick={() => onDuplicate(event)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Copy className="size-3.5" />
                </Button>

                <div className="flex-1" />

                <button
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? "Collapse registrations" : "Show registrations"}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium text-[#8AA2BD] transition-colors hover:bg-[#EEF6FF] hover:text-[#1F5D8F]"
                  onClick={() => toggleExpand(event.id)}
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

                <Button
                  aria-label="Delete event"
                  className="size-8 rounded-full text-[#55708D] hover:bg-[#FFF3F3] hover:text-[#B42318]"
                  onClick={() => onDelete(event)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="size-3.5" />
                </Button>
                </div>
              }
              variant="compact"
            />

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
