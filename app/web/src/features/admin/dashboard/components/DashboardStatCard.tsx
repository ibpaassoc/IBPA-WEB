import { CalendarDays, CreditCard, Newspaper, Users } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import type { AdminOverviewStat } from "../types/dashboard-admin.types";

type DashboardStatCardProps = {
  stat: AdminOverviewStat;
  index: number;
};

const STAT_ICONS: Record<string, React.ElementType> = {
  members: Users,
  "active-events": CalendarDays,
  revenue: CreditCard,
  articles: Newspaper,
};

export function DashboardStatCard({ index, stat }: DashboardStatCardProps) {
  const isAccent = index === 0;
  const Icon = STAT_ICONS[stat.key];

  return (
    <Link
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-6",
        "[box-shadow:var(--card-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:[box-shadow:var(--card-shadow-hover)]",
        isAccent
          ? "border-primary/20 bg-primary text-white"
          : "border-border bg-card text-foreground",
      )}
      href={stat.href}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "text-xs font-semibold uppercase tracking-wide",
            isAccent ? "text-white/60" : "text-muted-foreground",
          )}
        >
          {stat.label}
        </span>
        {Icon ? (
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-xl",
              isAccent ? "bg-white/15" : "bg-secondary",
            )}
          >
            <Icon
              className={cn("size-4", isAccent ? "text-white/80" : "text-primary")}
            />
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <span
          className={cn(
            "font-serif text-4xl font-medium tabular-nums leading-none",
            isAccent ? "text-white" : "text-foreground",
          )}
        >
          {stat.value.toLocaleString("en-US")}
        </span>
        {stat.change ? (
          <span
            className={cn(
              "mb-0.5 text-xs font-medium",
              isAccent ? "text-white/60" : "text-muted-foreground",
            )}
          >
            {stat.change.value >= 0 ? "+" : ""}
            {stat.change.label}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
