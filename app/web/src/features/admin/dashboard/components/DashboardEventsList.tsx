import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";

import type { AdminOverviewEvent } from "../types/dashboard-admin.types";

type DashboardEventsListProps = {
  events: AdminOverviewEvent[];
};

export function DashboardEventsList({ events }: DashboardEventsListProps) {
  if (!events.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No upcoming events.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-1">
      {events.map((event) => (
        <li key={event.id}>
          <Link
            className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary"
            href={event.href}
          >
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="size-3.5" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="truncate text-sm font-medium text-foreground">{event.title}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{event.dateLabel}</span>
                {event.location !== "Location to be announced" ? (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-0.5 truncate">
                      <MapPin className="size-3" />
                      {event.location}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
