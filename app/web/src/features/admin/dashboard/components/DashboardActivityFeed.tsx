import Link from "next/link";

import { cn } from "@/lib/utils";
import type { AdminOverviewActivity } from "../types/dashboard-admin.types";

const TONE_DOT: Record<string, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  info: "bg-[#6e9ab8]",
  neutral: "bg-muted-foreground/40",
};

type DashboardActivityFeedProps = {
  items: AdminOverviewActivity[];
};

export function DashboardActivityFeed({ items }: DashboardActivityFeedProps) {
  if (!items.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
    );
  }

  return (
    <ul className="flex flex-col">
      {items.map((activity, i) => (
        <li key={activity.id}>
          <Link
            className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary"
            href={activity.href}
          >
            <span
              className={cn(
                "mt-1.5 size-2 shrink-0 rounded-full",
                TONE_DOT[activity.tone] ?? TONE_DOT.neutral,
              )}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-sm font-medium leading-snug text-foreground">{activity.title}</p>
              <p className="text-xs text-muted-foreground">{activity.description}</p>
            </div>
            <span className="mt-0.5 shrink-0 text-xs text-muted-foreground">{activity.dateLabel}</span>
          </Link>
          {i < items.length - 1 ? (
            <div className="mx-3 h-px bg-border" />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
