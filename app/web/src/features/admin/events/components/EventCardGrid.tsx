"use client";

import { CalendarDays, Copy, MapPin, Pencil, Pin, Trash2 } from "lucide-react";
import { motion } from "motion/react";

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
        "card-vellum flex flex-col overflow-hidden",
        feature ? "md:col-span-2 md:row-span-2" : "",
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
          <motion.article
            key={event.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: Math.min(0.04 + index * 0.045, 0.5),
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
              "group card-premium relative flex cursor-pointer flex-col overflow-hidden",
              isSelected && "ring-2 ring-[var(--accent-copper)]",
              isFeature && "md:col-span-2 md:row-span-2",
            )}
            onClick={() => onOpen(event)}
          >
            {/* Cover */}
            <div
              className={cn(
                "relative overflow-hidden bg-[var(--mist)]",
                isFeature ? "aspect-[16/10]" : "aspect-[16/11]",
              )}
            >
              {event.coverImage ? (
                <>
                  <img
                    alt={event.title}
                    className="h-full w-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                    loading="lazy"
                    src={event.coverImage}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-[rgba(20,14,8,0.45)] via-transparent to-transparent opacity-90"
                  />
                </>
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{
                    backgroundImage:
                      "radial-gradient(80% 60% at 50% 40%, rgba(185,122,62,0.10), transparent 70%)",
                  }}
                >
                  <CalendarDays className="size-10 text-foreground/20" strokeWidth={1} />
                </div>
              )}

              {/* Glass badges */}
              <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
                <span
                  className={cn(
                    "glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium tracking-tight",
                    visibility === "Published"
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        visibility === "Published" ? "var(--tone-success)" : "var(--muted-foreground)",
                    }}
                  />
                  {visibility}
                </span>
                {event.isPinned ? (
                  <span className="glass inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10.5px] font-medium text-foreground">
                    <Pin className="size-2.5" />
                    Pinned
                  </span>
                ) : null}
              </div>

              {/* Date pill bottom-left for visual interest on feature */}
              {isFeature && event.eventDate ? (
                <div className="absolute bottom-4 left-4 flex flex-col gap-0.5">
                  <span className="editorial-eyebrow text-[11px] text-white/85">Save the date</span>
                  <span className="font-serif text-xl font-medium text-white drop-shadow-sm">
                    {formatAdminDate(event.eventDate)}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col gap-3 p-6">
              <h3
                className={cn(
                  "line-clamp-2 font-serif font-medium leading-snug text-foreground",
                  isFeature ? "text-2xl tracking-tight" : "text-lg",
                )}
                style={{ textWrap: "balance" }}
              >
                {event.title}
              </h3>

              <div className="flex flex-col gap-1.5">
                {!isFeature && event.eventDate ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5 shrink-0" />
                    <span className="tabular-nums">{formatAdminDate(event.eventDate)}</span>
                  </div>
                ) : null}
                {event.eventAddress ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">{event.eventAddress}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex-1" />

              <div
                className="-mb-1 flex items-center gap-1 border-t border-[var(--hairline)] pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  className="h-8 gap-1.5 rounded-full px-2.5 text-xs"
                  onClick={() => onOpen(event)}
                  type="button"
                  variant="ghost"
                >
                  <Pencil className="size-3" />
                  Edit
                </Button>
                <Button
                  className="h-8 gap-1.5 rounded-full px-2.5 text-xs"
                  onClick={() => onDuplicate(event)}
                  type="button"
                  variant="ghost"
                >
                  <Copy className="size-3" />
                  Duplicate
                </Button>
                <div className="flex-1" />
                <Button
                  className="size-8 rounded-full text-muted-foreground hover:bg-[var(--tone-warning-tint)] hover:text-destructive"
                  onClick={() => onDelete(event)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
