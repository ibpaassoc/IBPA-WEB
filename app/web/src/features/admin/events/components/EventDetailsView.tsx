"use client";

import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/content/EventCard";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();
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
        <EventCard
          event={{
            title: event.title,
            description: event.body,
            coverImage: event.coverImage,
            coverAspect: event.coverAspect ?? event.cover_aspect,
            imageMetadata: event.imageMetadata,
            eyebrow: t.contentImages.adminPreview,
          }}
          badges={
            <>
              <AdminStatusBadge
                tone={getEventVisibility(event) === "Published" ? "success" : "neutral"}
              >
                {getEventVisibility(event)}
              </AdminStatusBadge>
              {event.isPinned ? <AdminStatusBadge tone="info">Pinned</AdminStatusBadge> : null}
              {event.eventAllDay ? <AdminStatusBadge tone="neutral">All day</AdminStatusBadge> : null}
            </>
          }
          imageSizes="(min-width: 768px) 360px, 100vw"
          meta={[
            { kind: "date", label: "Starts", value: formatAdminDateTime(event.eventDate) },
            { kind: "date", label: "Ends", value: formatAdminDateTime(event.eventEndDate) },
            { kind: "location", label: "Location", value: event.eventAddress || "Not provided" },
          ]}
          actions={event.ctaUrl ? (
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
          variant="admin"
        />

        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Registrations" value={String(total)} />
          <InfoRow label="Registered" value={String(counts.registered)} />
          <InfoRow label="Cancelled" value={String(counts.cancelled)} />
        </dl>

      </div>
    </AdminSectionCard>
  );
}
