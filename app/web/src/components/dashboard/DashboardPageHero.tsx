"use client";

import { SectionCard } from "./DashboardShared";
import type { TabType } from "./dashboard-types";

type Props = {
  activeTab: TabType;
  statusLabel: string;
  memberSinceDisplay: string;
  lastSyncedAt: string | null;
};

function getDashboardTitle(activeTab: TabType) {
  switch (activeTab) {
    case "dashboard":
      return "Dashboard overview";
    case "profile":
      return "Profile";
    case "certificates":
      return "My certificates";
    case "billing":
      return "Billing & membership";
    case "events":
      return "Events & benefits";
    case "directory":
      return "Member directory";
    case "support":
      return "Support";
    case "notifications":
      return "Notifications";
    case "teamMembers":
      return "Team members";
    case "settings":
    default:
      return "Settings";
  }
}

export function DashboardPageHero({
  activeTab,
  statusLabel,
  memberSinceDisplay,
  lastSyncedAt,
}: Props) {
  return (
    <SectionCard className="bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)]">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4C7D9D]">
            Personal cabinet
          </p>

          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#10203B] md:text-4xl">
            {getDashboardTitle(activeTab)}
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500 md:text-base">
            Modern member tools aligned with the IBPA public site style: clean,
            minimal, responsive, and grounded in your existing live data.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#F5F8FC] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Status
            </p>
            <p className="mt-2 text-sm font-medium text-[#10203B]">
              {statusLabel}
            </p>
          </div>

          <div className="rounded-2xl bg-[#F5F8FC] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Member since
            </p>
            <p className="mt-2 text-sm font-medium text-[#10203B]">
              {memberSinceDisplay}
            </p>
          </div>

          <div className="rounded-2xl bg-[#F5F8FC] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Last sync
            </p>
            <p className="mt-2 text-sm font-medium text-[#10203B]">
              {lastSyncedAt
                ? new Date(lastSyncedAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "Just now"}
            </p>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
