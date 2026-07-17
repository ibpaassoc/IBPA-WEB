"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { InteractiveContentImage } from "@/components/content/InteractiveContentImage";
import { PreservedText } from "@/components/content/PreservedText";
import type { DashboardContentItem } from "@/components/dashboard/dashboard-types";
import {
  dashboardPrimaryButtonClassName,
  getDashboardFilterButtonClassName,
} from "@/shared/components/DashboardShared";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type EventCard = DashboardContentItem & {
  audience: "members" | "open";
  dateDisplay: string;
  price: string;
  discountLabel?: string | null;
};

const eventCardClassName =
  "overflow-hidden rounded-[28px] border border-[#D4E0F0] bg-white shadow-[0_18px_45px_rgba(11,31,68,0.08)]";

const infoBoxClassName = "rounded-2xl bg-[#F8FBFF] px-3.5 py-3";
const unregisterButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60";

function isRegistered(item: EventCard) {
  return (
    item.isRegistered === true ||
    String(item.registrationStatus || "").toUpperCase() === "REGISTERED"
  );
}

export function DashboardEvents({
  eventRegistrationFilter,
  setEventRegistrationFilter,
  filteredEventCards,
  registerDashboardEvent,
  unregisterDashboardEvent,
}: {
  eventRegistrationFilter: "all" | "registered" | "not_registered";
  setEventRegistrationFilter: (
    filter: "all" | "registered" | "not_registered",
  ) => void;
  filteredEventCards: EventCard[];
  registerDashboardEvent: (eventId: string) => Promise<unknown>;
  unregisterDashboardEvent: (eventId: string) => Promise<unknown>;
}) {
  const { t } = useI18n();
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  async function handleRegister(eventId: string) {
    setSubmittingId(eventId);

    try {
      const result = await registerDashboardEvent(eventId);
      const alreadyRegistered =
        typeof result === "object" &&
        result !== null &&
        "alreadyRegistered" in result &&
        result.alreadyRegistered === true;

      toast.success(
        alreadyRegistered ? "You are already registered for this event." : "Event registration saved.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to register for this event right now.",
      );
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleUnregister(eventId: string) {
    setSubmittingId(eventId);

    try {
      await unregisterDashboardEvent(eventId);
      toast.success("Event registration removed.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to unregister from this event right now.",
      );
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#21466D]">
          {t.dashboard.events.eyebrow}
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#10203B]">
          {t.dashboard.events.title}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {[
          { key: "all" as const, label: t.dashboard.events.filters.all },
          { key: "registered" as const, label: "Registered" },
          { key: "not_registered" as const, label: "Not registered" },
        ].map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setEventRegistrationFilter(filter.key)}
            className={getDashboardFilterButtonClassName(
              eventRegistrationFilter === filter.key,
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {filteredEventCards.length > 0 ? (
          filteredEventCards.map((item) => {
            const itemRegistered = isRegistered(item);
            const itemSubmitting = submittingId === item.id;
            const locationLabel = item.eventAddress?.trim() || t.dashboard.events.locationTbd;

            return (
              <article key={item.id} className={eventCardClassName}>
                {item.coverImage ? (
                  <div className="overflow-hidden border-b border-[#D4E0F0] bg-slate-100">
                    <InteractiveContentImage
                      alt={item.title}
                      caption={item.body}
                      legacyAspect={item.coverAspect}
                      legacyUrl={item.coverImage}
                      metadata={item.imageMetadata}
                      sizes="(min-width: 1280px) 560px, 100vw"
                    />
                  </div>
                ) : null}

                <div className="flex min-h-[350px] flex-col p-5">
                  {item.isPinned ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#FFF5D8] px-3 py-1 text-[11px] font-semibold text-amber-700">
                        {t.dashboard.events.highlighted}
                      </span>
                    </div>
                  ) : null}

                  <h3 className="mt-4 line-clamp-2 text-xl font-semibold leading-tight text-[#10203B]">
                    {item.title}
                  </h3>

                  <PreservedText className="mt-3 text-sm leading-6 text-slate-500">
                    {item.body}
                  </PreservedText>

                  <div className="mt-auto pt-5">
                    <div className="grid gap-2.5 sm:grid-cols-3">
                      <div className={infoBoxClassName}>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                          {t.dashboard.events.date}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#10203B]">
                          {item.dateDisplay}
                        </p>
                      </div>

                      <div className={infoBoxClassName}>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                          {t.dashboard.events.price}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#10203B]">
                          {item.price}
                        </p>
                      </div>

                      <div className={infoBoxClassName}>
                        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                          {t.dashboard.events.location}
                        </p>
                        <p className="mt-2 line-clamp-1 text-sm font-semibold text-[#10203B]">
                          {locationLabel}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={itemSubmitting}
                        onClick={() =>
                          void (itemRegistered
                            ? handleUnregister(item.id)
                            : handleRegister(item.id))
                        }
                        className={cn(
                          itemRegistered
                            ? unregisterButtonClassName
                            : dashboardPrimaryButtonClassName,
                        )}
                      >
                        {itemSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        {itemRegistered
                          ? t.dashboard.events.unregister
                          : t.dashboard.events.register}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[28px] border border-dashed border-[#D4E0F0] bg-white/90 p-8 text-center text-sm text-slate-500 shadow-[0_18px_45px_rgba(11,31,68,0.08)] xl:col-span-2">
            {t.dashboard.events.noMatches}
          </div>
        )}
      </div>
    </div>
  );
}
