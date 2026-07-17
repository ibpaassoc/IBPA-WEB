import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { InteractiveContentImage } from "@/components/content/InteractiveContentImage";
import { PreservedText } from "@/components/content/PreservedText";

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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#DCE7F5] bg-[#F8FBFF] p-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6C7F95]">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm font-medium text-[#10203B]">{value}</dd>
    </div>
  );
}

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

  const total = counts.registered + counts.waitlisted + counts.attended;

  return (
    <AdminSectionCard title="Event details">
      <div className="flex flex-col gap-5">
        {event.coverImage ? (
          <InteractiveContentImage
            alt={event.title}
            caption={event.body}
            className="rounded-[20px]"
            legacyAspect={event.coverAspect ?? event.cover_aspect}
            legacyUrl={event.coverImage}
            sizes="(min-width: 768px) 720px, 100vw"
          />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <AdminStatusBadge
            tone={getEventVisibility(event) === "Published" ? "success" : "neutral"}
          >
            {getEventVisibility(event)}
          </AdminStatusBadge>
          {event.isPinned ? <AdminStatusBadge tone="info">Pinned</AdminStatusBadge> : null}
          {event.eventAllDay ? <AdminStatusBadge tone="neutral">All day</AdminStatusBadge> : null}
        </div>

        <div>
          <h3 className="text-xl font-semibold tracking-[-0.01em] text-[#10203B]">{event.title}</h3>
          <PreservedText className="mt-2 text-sm leading-6 text-[#55708D]">
            {event.body}
          </PreservedText>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Starts" value={formatAdminDateTime(event.eventDate)} />
          <InfoRow label="Ends" value={formatAdminDateTime(event.eventEndDate)} />
          <InfoRow label="Location" value={event.eventAddress || "Not provided"} />
          <InfoRow label="Registrations" value={String(total)} />
          <InfoRow label="Registered" value={String(counts.registered)} />
          <InfoRow label="Cancelled" value={String(counts.cancelled)} />
        </dl>

        {event.ctaUrl ? (
          <Button
            asChild
            className="h-10 w-fit rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
            type="button"
            variant="outline"
          >
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
