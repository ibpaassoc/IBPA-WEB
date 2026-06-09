"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { getAdminOverview } from "../server/dashboard-admin.service";
import type { AdminOverviewData } from "../types/dashboard-admin.types";
import { DashboardActivityFeed } from "./DashboardActivityFeed";
import { DashboardCharts } from "./DashboardCharts";
import { DashboardEventsList } from "./DashboardEventsList";
import { DashboardStatCard } from "./DashboardStatCard";

const emptyOverview: AdminOverviewData = {
  stats: [],
  upcomingEvents: [],
  recentPayments: [],
  recentActivity: [],
};

export function AdminDashboardOverview() {
  const [overview, setOverview] = useState<AdminOverviewData>(emptyOverview);
  const [isLoading, setIsLoading] = useState(true);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await getAdminOverview();
      setOverview(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <AdminPageShell
      actions={
        <Button
          className="size-10 rounded-full"
          disabled={isLoading}
          onClick={() => void load(true)}
          size="icon"
          variant="outline"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      }
      eyebrow={today}
      subtitle="A quiet view across applications, members, content, and finance — the briefing for the day."
      title="Today at IBPA"
    >
      {/* Stat constellation — asymmetric: featured + tertiary */}
      <div className="grid gap-5 lg:grid-cols-4 lg:gap-6">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                className="h-44 rounded-3xl"
                key={i}
                style={{ backgroundColor: "var(--mist)" }}
              />
            ))
          : overview.stats.map((stat, i) => (
              <DashboardStatCard index={i} key={stat.key} stat={stat} />
            ))}
      </div>

      {/* Editorial divider */}
      <div className="flex items-center gap-5 pt-2">
        <span className="editorial-eyebrow text-sm">Atelier ledger</span>
        <span className="h-px flex-1 bg-[var(--hairline)]" />
      </div>

      {/* Charts — full width band */}
      {isLoading ? (
        <Skeleton className="h-80 rounded-3xl" style={{ backgroundColor: "var(--mist)" }} />
      ) : (
        <DashboardCharts data={overview} />
      )}

      {/* Asymmetric bottom — upcoming events take wider column */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_1fr]">
        <AdminSectionCard
          actions={
            <a
              className="group inline-flex items-center gap-1.5 text-xs font-medium tracking-tight text-foreground hairline-grow"
              href="/admin/events"
            >
              Open events
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </a>
          }
          eyebrow="On the calendar"
          title="Upcoming events"
        >
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton className="h-14" key={i} />)}
            </div>
          ) : (
            <DashboardEventsList events={overview.upcomingEvents} />
          )}
        </AdminSectionCard>

        <AdminSectionCard
          actions={
            <a
              className="group inline-flex items-center gap-1.5 text-xs font-medium tracking-tight text-foreground hairline-grow"
              href="/admin/applications"
            >
              Open queue
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </a>
          }
          eyebrow="From the floor"
          title="Recent activity"
        >
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton className="h-14" key={i} />)}
            </div>
          ) : (
            <DashboardActivityFeed items={overview.recentActivity} />
          )}
        </AdminSectionCard>
      </div>
    </AdminPageShell>
  );
}
