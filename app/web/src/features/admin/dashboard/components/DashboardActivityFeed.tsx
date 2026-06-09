import Link from "next/link";

import { cn } from "@/lib/utils";
import type { AdminOverviewActivity } from "../types/dashboard-admin.types";

const TONE_DOT: Record<string, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  info: "bg-[#6E9AB8]",
  neutral: "bg-[#A7B8CC]",
};

type DashboardActivityFeedProps = {
  items: AdminOverviewActivity[];
};

export function DashboardActivityFeed({ items }: DashboardActivityFeedProps) {
  if (!items.length) {
    return (
      <div className="rounded-2xl border border-[#D9E4F2] bg-white/70 px-4 py-8 text-center text-sm text-[#6B7C93]">
        No recent activity.
      </div>
    );
  }

  return (
    <ul className="grid gap-3">
      {items.map((activity) => (
        <li key={activity.id}>
          <Link
            className="group flex gap-3 rounded-2xl border border-[#D9E4F2] bg-white/72 p-3.5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#BDD0E8] hover:bg-white hover:shadow-[0_18px_40px_rgba(15,35,70,0.10)]"
            href={activity.href}
          >
            <span className="mt-1.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF]">
              <span
                className={cn(
                  "size-2 rounded-full",
                  TONE_DOT[activity.tone] ?? TONE_DOT.neutral,
                )}
              />
            </span>

            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#10203B]">
                {activity.title}
              </p>

              <p className="mt-1 text-xs font-medium text-[#8AA2BD]">
                {activity.dateLabel}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
