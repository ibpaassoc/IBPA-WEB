import { ExternalLink } from "lucide-react";

import { SectionCard, SectionHeader } from "@/shared/components/DashboardShared";
import type { DashboardContentItem } from "@/components/dashboard/dashboard-types";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";

type EventCard = DashboardContentItem & {
  audience: "members" | "open";
  dateDisplay: string;
  price: string;
  discountLabel?: string | null;
};

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
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          eyebrow="Events & Benefits"
          title="Member opportunities"
        />

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {[
            { key: "all" as const, label: "All events" },
            { key: "members" as const, label: "Members only" },
            { key: "open" as const, label: "Open to all" },
          ].map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setEventAudienceFilter(filter.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                eventAudienceFilter === filter.key
                  ? "bg-[#10203B] text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-[#4C7D9D]/40 hover:text-[#10203B]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {filteredEventCards.length > 0 ? (
            filteredEventCards.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#FBFCFE]"
              >
                {item.coverImage ? (
                  <div className="overflow-hidden border-b border-slate-200 bg-slate-100">
                    <ImageWithFallback
                      src={item.coverImage}
                      alt={item.title}
                      className="aspect-[16/9] w-full object-cover"
                    />
                  </div>
                ) : null}

                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                        item.audience === "members"
                          ? "bg-[#EAF4FF] text-[#4C7D9D]"
                          : "bg-[#F4F4F5] text-slate-600"
                      }`}
                    >
                      {item.audience === "members" ? "Members only" : "Open to all"}
                    </span>

                    {item.discountLabel ? (
                      <span className="rounded-full bg-[#F1F8F3] px-3 py-1 text-[11px] font-medium text-emerald-700">
                        {item.discountLabel}
                      </span>
                    ) : null}

                    {item.isPinned ? (
                      <span className="rounded-full bg-[#FFF5D8] px-3 py-1 text-[11px] font-medium text-amber-700">
                        Highlighted
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-4 break-words text-2xl font-semibold text-[#10203B]">
                    {item.title}
                  </h3>

                  <p className="mt-3 break-words text-sm leading-7 text-slate-500">
                    {item.body}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Date
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#10203B]">
                        {item.dateDisplay}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Price
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#10203B]">
                        {item.price}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                        Registration
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#10203B]">
                        {item.ctaLabel || "Register"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <a
                      href={item.ctaUrl || "/contact"}
                      target={item.ctaUrl ? "_blank" : undefined}
                      rel={item.ctaUrl ? "noreferrer" : undefined}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10203B] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1a3157]"
                    >
                      Register
                      <ExternalLink className="h-4 w-4" />
                    </a>

                    {item.discountLabel ? (
                      <div className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
                        {item.discountLabel}
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-200 bg-[#FBFCFE] p-8 text-center text-sm text-slate-500 xl:col-span-2">
              No events match the current filter yet.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
