"use client";

import { ArrowUpRight, CalendarDays, CreditCard, Newspaper, Users } from "lucide-react";
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.04 + index * 0.06,
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link
        className={cn(
          "group relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-3xl border p-6 lg:p-7",
          "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isAccent
            ? "border-[rgba(255,255,255,0.12)] bg-[#100e0d] text-[var(--sidebar-foreground)] hover:-translate-y-1"
            : "card-premium text-foreground",
        )}
        href={stat.href}
        style={
          isAccent
            ? {
                backgroundImage:
                  "radial-gradient(120% 50% at 0% 0%, rgba(185,122,62,0.22), transparent 60%), radial-gradient(80% 60% at 100% 100%, rgba(217,156,94,0.10), transparent 70%)",
              }
            : undefined
        }
      >
        {/* Decorative sheen on the accent tile */}
        {isAccent ? (
          <span
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full opacity-50 blur-3xl"
            style={{ backgroundColor: "rgba(217,156,94,0.20)" }}
          />
        ) : null}

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span
              className={cn(
                "text-[11px] font-medium tracking-tight",
                isAccent ? "text-[var(--accent-copper-soft)]" : "text-muted-foreground",
              )}
              style={isAccent ? undefined : { color: "var(--accent-copper)" }}
            >
              <span className="editorial-eyebrow text-xs">{stat.label}</span>
            </span>
          </div>
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full border transition-transform duration-500 group-hover:rotate-[18deg]",
              isAccent
                ? "border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)]"
                : "border-[var(--hairline)] bg-[var(--vellum)]",
            )}
          >
            {Icon ? (
              <Icon
                className={cn(
                  "size-[15px]",
                  isAccent ? "text-[var(--accent-copper-soft)]" : "text-foreground",
                )}
              />
            ) : null}
          </span>
        </div>

        <div className="relative flex items-end justify-between gap-3">
          <span
            className={cn(
              "font-serif font-medium leading-none tabular-nums",
              "text-[2.6rem] lg:text-[3.2rem]",
              isAccent ? "text-[var(--sidebar-foreground)]" : "text-foreground",
            )}
            style={{ letterSpacing: "-0.02em" }}
          >
            {stat.value.toLocaleString("en-US")}
          </span>
          <div className="mb-1 flex flex-col items-end gap-1">
            {stat.change ? (
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium tabular-nums",
                  isAccent
                    ? "border-[rgba(255,255,255,0.10)] text-[var(--sidebar-foreground)]"
                    : positiveChange
                      ? "border-[rgba(74,122,71,0.20)] text-[var(--tone-success)]"
                      : "border-[var(--hairline)] text-muted-foreground",
                )}
                style={
                  positiveChange && !isAccent
                    ? { backgroundColor: "var(--tone-success-tint)" }
                    : undefined
                }
              >
                {positiveChange ? "+" : ""}
                {stat.change.label}
              </span>
            ) : null}
            <ArrowUpRight
              className={cn(
                "size-3.5 opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
                isAccent ? "text-[var(--accent-copper-soft)]" : "text-muted-foreground",
              )}
            />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
