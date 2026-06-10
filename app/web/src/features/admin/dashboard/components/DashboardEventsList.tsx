import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";

import type { AdminOverviewEvent } from "../types/dashboard-admin.types";

type DashboardEventsListProps = {
  events: AdminOverviewEvent[];
};

export function DashboardEventsList({ events }: DashboardEventsListProps) {
  if (!events.length) {
    return (
      <div className="rounded-2xl border border-[#D9E4F2] bg-white/70 px-4 py-8 text-center text-sm text-[#6B7C93]">
        No upcoming events.
      </div>
    );
  }

  return (
    <ul className="grid gap-3">
      {events.map((event) => (
        <li key={event.id}>
          <Link
            className="group flex items-center gap-4 rounded-2xl border border-[#D9E4F2] bg-white/72 p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#BDD0E8] hover:bg-white hover:shadow-[0_18px_40px_rgba(15,35,70,0.10)]"
            href={event.href}
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#21466D] transition-colors group-hover:bg-[#E3EFFC]">
              <CalendarDays className="size-4" />
            </span>

            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="line-clamp-1 max-w-full text-sm font-semibold text-[#10203B]">
                {event.title}
              </p>

              <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#6B7C93]">
                <span className="shrink-0">{event.dateLabel}</span>

                {event.location !== "Location to be announced" ? (
                  <>
                    <span className="text-[#A7B8CC]">·</span>
                    <span className="flex min-w-0 max-w-full items-center gap-1 truncate">
                      <MapPin className="size-3 shrink-0 text-[#8AA2BD]" />
                      <span className="truncate">{event.location}</span>
                    </span>
                  </>
                ) : null}
              </div>
            </div>

            <span className="shrink-0 text-[#8AA2BD] transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
