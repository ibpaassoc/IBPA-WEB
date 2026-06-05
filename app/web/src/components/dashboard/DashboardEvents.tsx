import { ExternalLink } from "lucide-react";

import type { DashboardContentItem } from "@/components/dashboard/dashboard-types";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

type EventCard = DashboardContentItem & {
  audience: "members" | "open";
  dateDisplay: string;
  price: string;
  discountLabel?: string | null;
};

const filterButtonClassName =
  "rounded-full px-4 py-2 text-sm font-semibold transition";

const eventCardClassName =
  "overflow-hidden rounded-[28px] border border-[#D4E0F0] bg-white shadow-[0_18px_45px_rgba(11,31,68,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(11,31,68,0.13)]";

const infoBoxClassName = "rounded-2xl bg-[#F8FBFF] px-3.5 py-3";

export function DashboardEvents({
  eventAudienceFilter,
  setEventAudienceFilter,
  filteredEventCards,
}: {
  eventAudienceFilter: "all" | "members" | "open";
  setEventAudienceFilter: (filter: "all" | "members" | "open") => void;
  filteredEventCards: EventCard[];
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#21466D]">
          Events & Benefits
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#10203B]">
          Member opportunities
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {[
          { key: "all" as const, label: "All events" },
          { key: "members" as const, label: "Members only" },
          { key: "open" as const, label: "Open to all" },
        ].map((filter) => (
          <button
            key={filter.key}
            type="button"
            onClick={() => setEventAudienceFilter(filter.key)}
            className={`${filterButtonClassName} ${
              eventAudienceFilter === filter.key
                ? "bg-[#10203B] text-white shadow-[0_14px_30px_rgba(16,32,59,0.18)]"
                : "border border-[#D4E0F0] bg-white text-slate-600 hover:border-[#4C7D9D]/50 hover:text-[#10203B]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {filteredEventCards.length > 0 ? (
          filteredEventCards.map((item) => (
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

              <div className="flex min-h-[330px] flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                      item.audience === "members"
                        ? "bg-[#EAF4FF] text-[#4C7D9D]"
                        : "bg-[#F4F4F5] text-slate-600"
                    }`}
                  >
                    {item.audience === "members" ? "Members only" : "Open to all"}
                  </span>

                  {item.isPinned ? (
                    <span className="rounded-full bg-[#FFF5D8] px-3 py-1 text-[11px] font-semibold text-amber-700">
                      Highlighted
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
                        Date
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#10203B]">
                        {item.dateDisplay}
                      </p>
                    </div>

                    <div className={infoBoxClassName}>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                        Price
                      </p>
                      <p className="mt-2 text-sm font-semibold text-[#10203B]">
                        {item.price}
                      </p>
                    </div>

                    <div className={infoBoxClassName}>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                        Registration
                      </p>
                      <p className="mt-2 line-clamp-1 text-sm font-semibold text-[#10203B]">
                        {item.ctaLabel || "Register"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <a
                      href={item.ctaUrl || "/contact"}
                      target={item.ctaUrl ? "_blank" : undefined}
                      rel={item.ctaUrl ? "noreferrer" : undefined}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10203B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a3157]"
                    >
                      Register
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[28px] border border-dashed border-[#D4E0F0] bg-white/90 p-8 text-center text-sm text-slate-500 shadow-[0_18px_45px_rgba(11,31,68,0.08)] xl:col-span-2">
            No events match the current filter yet.
          </div>
        )}
      </div>
    </div>
  );
}
