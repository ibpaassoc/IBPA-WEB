"use client";

import { useState } from "react";
import { ArrowUpRight, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { DashboardContentItem } from "@/components/dashboard/dashboard-types";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import {
  dashboardPrimaryButtonClassName,
  dashboardSecondaryButtonClassName,
  getDashboardFilterButtonClassName,
} from "@/shared/components/DashboardShared";
import { useI18n } from "@/lib/i18n";

type EventCard = DashboardContentItem & {
  audience: "members" | "open";
  dateDisplay: string;
  price: string;
  discountLabel?: string | null;
};

const eventCardClassName =
  "overflow-hidden rounded-[28px] border border-[#D4E0F0] bg-white shadow-[0_18px_45px_rgba(11,31,68,0.08)]";

const infoBoxClassName = "rounded-2xl bg-[#F8FBFF] px-3.5 py-3";

function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

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
}: {
  eventRegistrationFilter: "all" | "registered" | "not_registered";
  setEventRegistrationFilter: (
    filter: "all" | "registered" | "not_registered",
  ) => void;
  filteredEventCards: EventCard[];
  registerDashboardEvent: (eventId: string) => Promise<unknown>;
}) {
  const { t } = useI18n();
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  async function handleRegister(eventId: string) {
    setRegisteringId(eventId);

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
      setRegisteringId(null);
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
          { key: "all" as const, label: "All events" },
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
            const itemRegistering = registeringId === item.id;

            return (
              <article key={item.id} className={eventCardClassName}>
                {item.coverImage ? (
                  <div className="overflow-hidden border-b border-[#D4E0F0] bg-slate-100">
                    <ImageWithFallback
                      src={item.coverImage}
                      alt={item.title}
                      className="aspect-[16/7] w-full object-cover"
                    />
                  </div>
                ) : null}

                <div className="flex min-h-[350px] flex-col p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        item.audience === "members"
                          ? "bg-[#EAF4FF] text-[#4C7D9D]"
                          : "bg-[#F4F4F5] text-slate-600"
                      }`}
                    >
                      {item.audience === "members"
                        ? t.dashboard.events.audienceMembers
                        : t.dashboard.events.audienceOpen}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        itemRegistered
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {itemRegistered ? "Registered" : "Not registered"}
                    </span>

                    {item.isPinned ? (
                      <span className="rounded-full bg-[#FFF5D8] px-3 py-1 text-[11px] font-semibold text-amber-700">
                        {t.dashboard.events.highlighted}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-4 line-clamp-2 text-xl font-semibold leading-tight text-[#10203B]">
                    {item.title}
                  </h3>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                    {item.body}
                  </p>

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
                          {t.dashboard.events.registration}
                        </p>
                        <p className="mt-2 line-clamp-1 text-sm font-semibold text-[#10203B]">
                          {itemRegistered ? "Registered" : t.dashboard.events.register}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={itemRegistered || itemRegistering}
                        onClick={() => void handleRegister(item.id)}
                        className={dashboardPrimaryButtonClassName}
                      >
                        {itemRegistering ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        {itemRegistered ? "Registered" : t.dashboard.events.register}
                      </button>

                      {item.ctaUrl ? (
                        <a
                          href={item.ctaUrl}
                          target={isExternalUrl(item.ctaUrl) ? "_blank" : undefined}
                          rel={isExternalUrl(item.ctaUrl) ? "noreferrer" : undefined}
                          className={dashboardSecondaryButtonClassName}
                        >
                          {item.ctaLabel || t.dashboard.events.openEvent}
                          {isExternalUrl(item.ctaUrl) ? (
                            <ExternalLink className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </a>
                      ) : null}
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
