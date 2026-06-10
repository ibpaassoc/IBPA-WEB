"use client";

import {
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Newspaper,
  Users,
} from "lucide-react";
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
  const positiveChange = stat.change && stat.change.value >= 0;

  return (
    <Link
      className={cn(
        "group relative flex h-full min-h-36 flex-col justify-between overflow-hidden rounded-[28px] border p-5",
        "shadow-[0_18px_45px_rgba(15,46,83,0.06)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,46,83,0.09)]",
        isAccent
          ? "border-transparent bg-[linear-gradient(135deg,#10203B_0%,#1F5D8F_100%)] text-white"
          : "border-[#D7E5F4] bg-white text-[#10203B]",
      )}
      href={stat.href}
    >
      <div className="relative flex items-start justify-between gap-3">
        <span
          className={cn(
            "text-[10px] font-bold uppercase tracking-[0.22em]",
            isAccent ? "text-white/70" : "text-[#8AA2BD]",
          )}
        >
          {stat.label}
        </span>

        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-2xl",
            isAccent ? "bg-white/15 text-white" : "bg-[#EEF6FF] text-[#1F5D8F]",
          )}
        >
          {Icon ? <Icon className="size-4" /> : null}
        </span>
      </div>

      <div className="relative flex items-end justify-between gap-3">
        <span
          className={cn(
            "text-4xl font-semibold leading-none tracking-[-0.03em] tabular-nums",
            isAccent ? "text-white" : "text-[#10203B]",
          )}
        >
          {stat.valueLabel ?? stat.value.toLocaleString("en-US")}
        </span>

        <div className="mb-1 flex flex-col items-end gap-2">
          {stat.change ? (
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tabular-nums",
                isAccent
                  ? "border-white/20 bg-white/10 text-white"
                  : positiveChange
                    ? "border-[#BFE6D4] bg-[#F2FBF7] text-[#197A52]"
                    : "border-[#D7E5F4] bg-[#F8FBFF] text-[#55708D]",
              )}
            >
              {positiveChange ? "+" : ""}
              {stat.change.label}
            </span>
          ) : null}

          <ArrowUpRight
            className={cn(
              "size-3.5 opacity-0 transition-all duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100",
              isAccent ? "text-white/70" : "text-[#8AA2BD]",
            )}
          />
        </div>
      </div>
    </Link>
  );
}
