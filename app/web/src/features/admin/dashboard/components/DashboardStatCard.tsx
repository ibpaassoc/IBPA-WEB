"use client";

import {
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Newspaper,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
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
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.04 + index * 0.05,
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="h-full"
    >
      <Link
        className={cn(
          "group relative flex h-full min-h-36 flex-col justify-between overflow-hidden rounded-[28px] border p-5",
          "shadow-[0_18px_48px_rgba(15,35,70,0.09)] backdrop-blur-2xl",
          "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_26px_70px_rgba(15,35,70,0.14)]",
          isAccent
            ? "border-[#123C7A]/20 bg-[#0B1F44] text-white"
            : "border-white/70 bg-white/78 text-[#10203B]",
        )}
        href={stat.href}
      >
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0",
            isAccent
              ? "bg-[radial-gradient(circle_at_20%_0%,rgba(159,199,242,0.24),transparent_42%),linear-gradient(145deg,rgba(18,60,122,0.92),rgba(11,31,68,1))]"
              : "bg-[linear-gradient(145deg,rgba(255,255,255,0.85),rgba(239,246,255,0.52))]",
          )}
        />

        <span
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-14 size-40 rounded-full bg-white/20 blur-3xl transition-transform duration-700 group-hover:scale-125"
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.24em]",
                isAccent ? "text-[#BFD9F7]" : "text-[#7A94B2]",
              )}
            >
              {stat.label}
            </span>
          </div>

          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-2xl border transition-all duration-500 group-hover:rotate-[10deg]",
              isAccent
                ? "border-white/15 bg-white/10 text-white"
                : "border-[#D9E4F2] bg-[#EEF5FF] text-[#21466D]",
            )}
          >
            {Icon ? <Icon className="size-4" /> : null}
          </span>
        </div>

        <div className="relative flex items-end justify-between gap-3">
          <span
            className={cn(
              "font-serif text-[2.5rem] font-medium leading-none tracking-[-0.04em] tabular-nums",
              isAccent ? "text-white" : "text-[#10203B]",
            )}
          >
            {stat.value.toLocaleString("en-US")}
          </span>

          <div className="mb-1 flex flex-col items-end gap-2">
            {stat.change ? (
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                  isAccent
                    ? "border-white/15 bg-white/10 text-white"
                    : positiveChange
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-[#D9E4F2] bg-white/70 text-[#6B7C93]",
                )}
              >
                {positiveChange ? "+" : ""}
                {stat.change.label}
              </span>
            ) : null}

            <ArrowUpRight
              className={cn(
                "size-3.5 opacity-0 transition-all duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100",
                isAccent ? "text-[#BFD9F7]" : "text-[#7A94B2]",
              )}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
