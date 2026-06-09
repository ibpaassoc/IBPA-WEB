import Link from "next/link";

import { cn } from "@/lib/utils";
import type { AdminOverviewStat } from "../types/dashboard-admin.types";

type DashboardStatCardProps = {
  stat: AdminOverviewStat;
  index: number;
};

const STAT_ICONS: Record<string, string> = {
  members: "👥",
  "active-events": "📅",
  revenue: "💳",
  articles: "📰",
};

export function DashboardStatCard({ index, stat }: DashboardStatCardProps) {
  const isAccent = index === 0;
  const emoji = STAT_ICONS[stat.key];

  return (
    <Link
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden rounded-xl border p-5",
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
            isAccent ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {stat.label}
        </span>
        {emoji ? (
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg text-sm",
              isAccent ? "bg-white/15" : "bg-secondary",
            )}
          >
            {emoji}
          </span>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-2">
        <span className="text-3xl font-semibold tabular-nums tracking-tight">
          {stat.value.toLocaleString("en-US")}
        </span>
        {stat.change ? (
          <span
            className={cn(
              "mb-0.5 text-xs font-medium",
              isAccent ? "text-white/70" : "text-muted-foreground",
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
