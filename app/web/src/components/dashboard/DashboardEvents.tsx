import { ArrowUpRight, ExternalLink } from "lucide-react";

import type { DashboardContentItem } from "@/components/dashboard/dashboard-types";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { useI18n } from "@/lib/i18n";

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

function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function DashboardEvents({
  eventAudienceFilter,
  setEventAudienceFilter,
  filteredEventCards,
}: {
  eventAudienceFilter: "all" | "members" | "open";
  setEventAudienceFilter: (filter: "all" | "members" | "open") => void;
  filteredEventCards: EventCard[];
}) {
  const { t } = useI18n();
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
          { key: "members" as const, label: t.dashboard.events.filters.members },
          { key: "open" as const, label: t.dashboard.events.filters.open },
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
            <a
              key={item.id}
              href={item.ctaUrl || "/contact"}
              target={item.ctaUrl && isExternalUrl(item.ctaUrl) ? "_blank" : undefined}
              rel={item.ctaUrl && isExternalUrl(item.ctaUrl) ? "noreferrer" : undefined}
              className={`${eventCardClassName} group block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#72A0C1]/20`}
              aria-label={`${item.ctaLabel || t.dashboard.events.openEvent}: ${item.title}`}
            >
              {item.coverImage ? (
                <div className="overflow-hidden border-b border-[#D4E0F0] bg-slate-100">
                  <ImageWithFallback
                    src={item.coverImage}
                    alt={item.title}
                    className="aspect-[16/7] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
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
                    {item.audience === "members"
                      ? t.dashboard.events.audienceMembers
                      : t.dashboard.events.audienceOpen}
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
                        {item.ctaLabel || t.dashboard.events.register}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#10203B]">
                    {item.ctaLabel || t.dashboard.events.register}
                    {item.ctaUrl && isExternalUrl(item.ctaUrl) ? (
                      <ExternalLink className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    )}
                  </div>
                </div>
              </div>
            </a>
          ))
        ) : (
          <div className="rounded-[28px] border border-dashed border-[#D4E0F0] bg-white/90 p-8 text-center text-sm text-slate-500 shadow-[0_18px_45px_rgba(11,31,68,0.08)] xl:col-span-2">
            {t.dashboard.events.noMatches}
          </div>
        )}
      </div>
    </div>
  );
}
