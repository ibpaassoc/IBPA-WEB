"use client";

import {
  CalendarDays,
  FileText,
  Mail,
  RefreshCw,
  Users,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import dynamic from "next/dynamic";

import { AdminPageShell } from "../../shared/components/AdminPageShell";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { getAdminOverview } from "../server/dashboard-admin.service";
import type { AdminOverviewData } from "../types/dashboard-admin.types";
import { DashboardActivityFeed } from "./DashboardActivityFeed";
import { DashboardEventsList } from "./DashboardEventsList";
import { DashboardStatCard } from "./DashboardStatCard";

// recharts is ~100 KB gzipped — load it after the page is interactive instead
// of blocking the admin overview bundle on it.
const DashboardCharts = dynamic(
  () => import("./DashboardCharts").then((mod) => mod.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-80 rounded-[32px] bg-white/70" />
        <Skeleton className="h-80 rounded-[32px] bg-white/70" />
      </div>
    ),
  },
);

const emptyOverview: AdminOverviewData = {
  stats: [],
  upcomingEvents: [],
  recentPayments: [],
  recentActivity: [],
};

const quickActions = [
  { label: "Applications", href: "/admin/applications", icon: FileText },
  { label: "Members", href: "/admin/members", icon: Users },
  { label: "Events", href: "/admin/events", icon: CalendarDays },
  { label: "Mailing", href: "/admin/mailing", icon: Mail },
  { label: "Finance", href: "/admin/payments", icon: WalletCards },
];

export function AdminDashboardOverview() {
  const [overview, setOverview] = useState<AdminOverviewData>(emptyOverview);
  const [isLoading, setIsLoading] = useState(true);

  const load = async (silent = false) => {
    if (!silent) setIsLoading(true);

    try {
      const data = await getAdminOverview();
      setOverview(data);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load dashboard.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const featuredStat = overview.stats[0];
  const secondaryStats = useMemo(() => overview.stats.slice(1), [overview.stats]);

  return (
    <AdminPageShell
      actions={
        <Button
          className="size-10 rounded-full border-[#D4E0F0] bg-white/80 text-[#21466D] shadow-sm backdrop-blur-xl hover:bg-white hover:text-[#0B1F44]"
          disabled={isLoading}
          onClick={() => void load(true)}
          size="icon"
          variant="outline"
        >
          <RefreshCw
            className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
        </Button>
      }
      eyebrow={today}
      title="Today at IBPA"
    >
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2">
            {isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton
                    className="h-36 rounded-[30px] bg-white/70"
                    key={index}
                  />
                ))
              : overview.stats.map((stat, index) => (
                  <DashboardStatCard index={index} key={stat.key} stat={stat} />
                ))}
          </section>

          {isLoading ? (
            <div className="grid gap-6 xl:grid-cols-2">
              <Skeleton className="h-80 rounded-[32px] bg-white/70" />
              <Skeleton className="h-80 rounded-[32px] bg-white/70" />
            </div>
          ) : (
            <DashboardCharts data={overview} />
          )}

          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)]">
            <AdminSectionCard
              actions={
                <Link
                  className="text-xs font-semibold text-[#21466D] transition-colors hover:text-[#0B1F44]"
                  href="/admin/events"
                  prefetch={false}
                >
                  View all →
                </Link>
              }
              eyebrow="Calendar"
              title="Upcoming events"
            >
              {isLoading ? (
                <div className="grid gap-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton className="h-16 rounded-2xl" key={index} />
                  ))}
                </div>
              ) : (
                <DashboardEventsList events={overview.upcomingEvents} />
              )}
            </AdminSectionCard>

            <AdminSectionCard
              actions={
                <Link
                  className="text-xs font-semibold text-[#21466D] transition-colors hover:text-[#0B1F44]"
                  href="/admin/applications"
                  prefetch={false}
                >
                  Open queue →
                </Link>
              }
              eyebrow="Activity"
              title="Recent activity"
            >
              {isLoading ? (
                <div className="grid gap-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton className="h-16 rounded-2xl" key={index} />
                  ))}
                </div>
              ) : (
                <DashboardActivityFeed items={overview.recentActivity} />
              )}
            </AdminSectionCard>
          </div>
        </div>

        <aside className="2xl:sticky 2xl:top-24 2xl:self-start">
          <AdminSectionCard
            className="shadow-[0_26px_80px_rgba(15,35,70,0.12)]"
            eyebrow="Shortcuts"
            title="Quick actions"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-1">
              {quickActions.map((action) => (
                <Link
                  className="group flex items-center gap-3 rounded-2xl border border-[#D9E4F2] bg-white/72 p-3.5 text-sm font-semibold text-[#10203B] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#BDD0E8] hover:bg-white hover:shadow-[0_18px_40px_rgba(15,35,70,0.10)]"
                  href={action.href}
                  key={action.href}
                  prefetch={false}
                >
                  <span className="flex size-10 items-center justify-center rounded-2xl bg-[#EEF5FF] text-[#21466D] transition-colors group-hover:bg-[#E3EFFC]">
                    <action.icon className="size-4" />
                  </span>
                  <span className="flex-1">{action.label}</span>
                  <span className="text-[#8AA2BD] transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </AdminSectionCard>
        </aside>
      </div>
    </AdminPageShell>
  );
}
