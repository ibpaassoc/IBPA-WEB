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

  return (
    <AdminPageShell
      actions={
        <Button
          className="size-8 rounded-lg"
          disabled={isLoading}
          onClick={() => void load(true)}
          size="icon"
          variant="outline"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      }
      title="Dashboard"
    >
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton className="h-28 rounded-xl" key={i} />
            ))
          : overview.stats.map((stat, i) => (
              <DashboardStatCard index={i} key={stat.key} stat={stat} />
            ))}
      </div>

      {/* Charts */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Skeleton className="h-[216px] rounded-xl" />
          <Skeleton className="h-[216px] rounded-xl" />
        </div>
      ) : (
        <DashboardCharts data={overview} />
      )}

      {/* Bottom row: upcoming events + recent activity */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.4fr]">
        <AdminSectionCard
          actions={
            <a className="text-xs font-medium text-primary hover:underline" href="/admin/events">
              View all
            </a>
          }
          title="Upcoming events"
        >
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton className="h-12" key={i} />)}
            </div>
          ) : (
            <DashboardEventsList events={overview.upcomingEvents} />
          )}
        </AdminSectionCard>

        <AdminSectionCard
          actions={
            <a className="text-xs font-medium text-primary hover:underline" href="/admin/applications">
              View all
            </a>
          }
          title="Recent activity"
        >
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton className="h-12" key={i} />)}
            </div>
          ) : (
            <DashboardActivityFeed items={overview.recentActivity} />
          )}
        </AdminSectionCard>
      </div>
    </AdminPageShell>
  );
}
