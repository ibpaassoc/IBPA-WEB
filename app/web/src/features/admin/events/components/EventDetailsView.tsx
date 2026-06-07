import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { formatAdminDateTime } from "../../shared/utils/admin-formatters";
import { getEventVisibility } from "../server/event-admin.service";
import type { AdminEvent, EventRegistrationCounts } from "../types/event-admin.types";

type EventDetailsViewProps = {
  event?: AdminEvent | null;
  counts: EventRegistrationCounts;
};

export function EventDetailsView({ counts, event }: EventDetailsViewProps) {
  if (!event) {
    return (
      <AdminSectionCard title="Event details">
        <AdminEmptyState
          description="Select an event to inspect registrations and publishing status."
          title="No event selected"
        />
      </AdminSectionCard>
    );
  }

  return (
    <AdminSectionCard title="Event details">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          <AdminStatusBadge tone={getEventVisibility(event) === "Published" ? "success" : "neutral"}>
            {getEventVisibility(event)}
          </AdminStatusBadge>
          {event.isPinned ? <AdminStatusBadge tone="accent">Pinned</AdminStatusBadge> : null}
          {event.eventAllDay ? <AdminStatusBadge tone="neutral">All day</AdminStatusBadge> : null}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-foreground">{event.title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{event.body}</p>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "Starts", value: formatAdminDateTime(event.eventDate) },
            { label: "Ends", value: formatAdminDateTime(event.eventEndDate) },
            { label: "Location", value: event.eventAddress || "Not provided" },
            { label: "Registrations", value: String(counts.registered + counts.waitlisted + counts.attended) },
            { label: "Registered", value: String(counts.registered) },
            { label: "Cancelled", value: String(counts.cancelled) },
          ].map((item) => (
            <div className="rounded-lg bg-muted/30 p-3" key={item.label}>
              <dt className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-1 text-sm text-foreground">{item.value}</dd>
            </div>
          ))}
        </dl>
        {event.ctaUrl ? (
          <Button asChild type="button" variant="outline">
            <a href={event.ctaUrl} rel="noreferrer" target="_blank">
              <ExternalLink data-icon="inline-start" />
              Preview event link
            </a>
          </Button>
        ) : null}
      </div>
    </AdminSectionCard>
  );
}
