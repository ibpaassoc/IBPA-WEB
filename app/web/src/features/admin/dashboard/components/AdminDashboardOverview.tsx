"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { ArrowUpRight, CalendarClock, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { getAdminOverview } from "../server/dashboard-admin.service";
import type { AdminOverviewData } from "../types/dashboard-admin.types";

const emptyOverview: AdminOverviewData = {
  stats: [],
  upcomingEvents: [],
  recentPayments: [],
  recentActivity: [],
};

export function AdminDashboardOverview() {
  const [overview, setOverview] = useState<AdminOverviewData>(emptyOverview);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const loadOverview = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setIsLoading(true);
    }

    try {
      const data = await getAdminOverview();
      setOverview(data);
      setLastSyncedAt(new Date().toISOString());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load the dashboard overview.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
  }, []);

  return (
    <AdminPageShell
      actions={
        <Button onClick={() => void loadOverview({ silent: true })} size="sm" variant="outline">
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      }
      description="A snapshot of membership, partnerships, and activity across the workspace."
      lastSyncedAt={lastSyncedAt}
      title="Dashboard"
    >
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <Skeleton className="h-[128px] w-full rounded-2xl" key={index} />
            ))
          : overview.stats.map((stat, index) => {
              const isHighlight = index === 0;

              return (
                <Link
                  className={cn(
                    "group flex flex-col gap-3 overflow-hidden rounded-2xl border p-5 shadow-[0_1px_2px_rgba(33,70,109,0.04),0_18px_36px_-26px_rgba(33,70,109,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-24px_rgba(33,70,109,0.45)]",
                    isHighlight
                      ? "border-transparent bg-[radial-gradient(circle_at_85%_-10%,rgba(114,160,193,0.45),transparent_46%),linear-gradient(135deg,#10203b_0%,#21466d_55%,#2b5c99_100%)] text-white"
                      : "border-border bg-card text-[#16243a] hover:border-[#c7d7e8]",
                  )}
                  href={stat.href}
                  key={stat.key}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-xs font-semibold uppercase tracking-[0.16em]",
                        isHighlight ? "text-white/65" : "text-[#5c7896]",
                      )}
                    >
                      {stat.label}
                    </span>
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
                        isHighlight ? "bg-white/15 text-white" : "bg-[#e9f1f8] text-[#2b5c99]",
                      )}
                    >
                      <ArrowUpRight className="size-3.5" />
                    </span>
                  </div>
                  <span className="text-3xl font-semibold tracking-tight">
                    {stat.value.toLocaleString("en-US")}
                  </span>
                  <span className={cn("text-sm", isHighlight ? "text-white/70" : "text-muted-foreground")}>
                    {stat.description}
                  </span>
                </Link>
              );
            })}
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <AdminSectionCard
          className="xl:col-span-2"
          description="The latest applications, approvals, payments, and event updates."
          title="Recent activity"
        >
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton className="h-14 w-full" key={index} />
              ))}
            </div>
          ) : overview.recentActivity.length ? (
            <ul className="flex flex-col gap-1">
              {overview.recentActivity.map((activity) => (
                <li key={activity.id}>
                  <Link
                    className="flex flex-col gap-1 rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary"
                    href={activity.href}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">{activity.title}</p>
                      <AdminStatusBadge className="shrink-0" tone={activity.tone}>
                        {activity.dateLabel}
                      </AdminStatusBadge>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No recent activity to show yet.
            </p>
          )}
        </AdminSectionCard>

        <div className="flex flex-col gap-6">
          <AdminSectionCard description="Published events sorted by start date." title="Upcoming events">
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton className="h-14 w-full" key={index} />
                ))}
              </div>
            ) : overview.upcomingEvents.length ? (
              <ul className="flex flex-col gap-1">
                {overview.upcomingEvents.map((event) => (
                  <li key={event.id}>
                    <Link
                      className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary"
                      href={event.href}
                    >
                      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(180deg,#f4f9ff_0%,#eaf4ff_100%)] text-[#2b5c99] shadow-[0_8px_18px_rgba(43,92,153,0.12)]">
                        <CalendarClock className="size-4" />
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <p className="truncate text-sm font-medium text-foreground">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.dateLabel} · {event.location}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                No upcoming events scheduled.
              </p>
            )}
          </AdminSectionCard>

          <AdminSectionCard description="Member and partner payments, most recent first." title="Recent payments">
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton className="h-14 w-full" key={index} />
                ))}
              </div>
            ) : overview.recentPayments.length ? (
              <ul className="flex flex-col gap-1">
                {overview.recentPayments.map((payment) => (
                  <li key={payment.id}>
                    <Link
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary"
                      href={payment.href}
                    >
                      <div className="flex min-w-0 flex-col">
                        <p className="truncate text-sm font-medium text-foreground">{payment.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {payment.sourceLabel} · {payment.dateLabel}
                        </p>
                      </div>
                      <AdminStatusBadge className={cn("shrink-0")} tone={payment.statusTone}>
                        {payment.statusLabel}
                      </AdminStatusBadge>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                No payments recorded yet.
              </p>
            )}
          </AdminSectionCard>
        </div>
      </section>
    </AdminPageShell>
  );
}
