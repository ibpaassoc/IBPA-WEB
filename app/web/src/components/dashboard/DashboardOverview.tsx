import Link from "next/link";
import type { ReactNode } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { SectionCard, StatusPill } from "@/components/dashboard/DashboardShared";
import type { Certificate } from "@/components/dashboard/dashboard-types";
import type { DashboardNotification } from "@/lib/notifications";

type OverviewCard = {
  label: string;
  value: string;
  helper: string;
};

type QuickAction = {
  label: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
};

type ProfileChecklist = ReturnType<
  typeof import("@/lib/dashboard-cabinet").buildOnboardingChecklist
>;

type NotificationMeta = {
  categoryLabel: string;
  priorityLabel: string;
  categoryClassName: string;
  priorityClassName: string;
};

type DashboardTab =
  | "billing"
  | "notifications"
  | "certificates"
  | "events"
  | "support"
  | "directory";

export function DashboardOverview({
  statusSummary,
  isTeamMemberDashboard,
  isMembershipActive,
  fullName,
  username,
  locationDisplay,
  specializationDisplay,
  overviewCards,
  profileChecklist,
  profileHeroImage,
  memberIdDisplay,
  dashboardContactEmail,
  certificateStatusDisplay,
  copyPublicLink,
  publicProfileHref,
  alertCards,
  getNotificationMeta,
  setActiveTab,
  quickActions,
  certificates,
  billingEntries,
  dashboardEvents,
}: {
  statusSummary: {
    label: string;
    description: string;
    tone: "pending" | "active" | "verified";
  };
  isTeamMemberDashboard: boolean;
  isMembershipActive: boolean;
  fullName: string;
  username: string;
  locationDisplay: string;
  specializationDisplay: string;
  overviewCards: OverviewCard[];
  profileChecklist: ProfileChecklist;
  profileHeroImage: string | null;
  memberIdDisplay: string;
  dashboardContactEmail: string;
  certificateStatusDisplay: string;
  copyPublicLink: () => void;
  publicProfileHref: string | null;
  alertCards: DashboardNotification[];
  getNotificationMeta: (notification: DashboardNotification) => NotificationMeta;
  setActiveTab: (tab: DashboardTab) => void;
  quickActions: QuickAction[];
  certificates: Certificate[];
  billingEntries: { id: string }[];
  dashboardEvents: unknown[];
}) {
  const topAlerts = alertCards.slice(0, 3);

  return (
    <div className="space-y-6">
      <SectionCard className="bg-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-[#E9F1F8] text-xl font-semibold text-[#10203B]">
              {profileHeroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileHeroImage}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                fullName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <StatusPill label={statusSummary.label} tone={statusSummary.tone} />

                {!isTeamMemberDashboard ? (
                  <StatusPill
                    label="Verified IBPA Member"
                    tone={isMembershipActive ? "verified" : "pending"}
                  />
                ) : null}
              </div>

              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#10203B] md:text-4xl">
                {fullName}
              </h1>

              <p className="mt-1 text-sm text-slate-500">@{username}</p>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#4C7D9D]" />
                  {locationDisplay}
                </span>

                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#4C7D9D]" />
                  {specializationDisplay}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href="/dashboard/profile/edit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10203B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1a3157]"
            >
              Edit Profile
              <ChevronRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={() => setActiveTab("billing")}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#10203B] transition hover:border-[#4C7D9D]/40"
            >
              Membership
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4C7D9D]">
                {item.label}
              </p>
              <p className="mt-2 text-base font-semibold text-[#10203B]">
                {item.value}
              </p>
              <p className="mt-1 text-sm text-slate-500">{item.helper}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <SectionCard>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4C7D9D]">
                  Profile completion
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {profileChecklist.completed} of {profileChecklist.total} steps completed.
                </p>
              </div>

              <p className="text-2xl font-semibold text-[#10203B]">
                {profileChecklist.percentage}%
              </p>
            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#4C7D9D]"
                style={{ width: `${profileChecklist.percentage}%` }}
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {profileChecklist.items.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
                >
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Clock3 className="h-4 w-4 text-amber-500" />
                  )}

                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4C7D9D]">
                  Quick actions
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  Main actions without extra dashboard clutter.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {quickActions.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-[#FBFCFE] p-4 text-left transition hover:border-[#c5d7e6] hover:bg-white"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#E9F1F8] text-[#4C7D9D]">
                    {item.icon}
                  </div>

                  <div>
                    <p className="font-semibold text-[#10203B]">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {item.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4C7D9D]">
              Member identity
            </p>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#F8FAFC] px-4 py-3">
                <span className="text-slate-500">Member ID</span>
                <span className="font-semibold text-[#10203B]">{memberIdDisplay}</span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#F8FAFC] px-4 py-3">
                <span className="text-slate-500">Badge</span>
                <span className="inline-flex items-center gap-2 font-semibold text-[#10203B]">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Verified
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#F8FAFC] px-4 py-3">
                <span className="text-slate-500">Certificate</span>
                <span className="font-semibold text-[#10203B]">
                  {certificateStatusDisplay}
                </span>
              </div>

              <p className="break-words px-1 text-slate-500">
                {dashboardContactEmail || "Primary member email unavailable"}
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={copyPublicLink}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#10203B] transition hover:border-[#4C7D9D]/40"
              >
                <Copy className="h-4 w-4" />
                Copy public link
              </button>

              {publicProfileHref ? (
                <Link
                  href={publicProfileHref}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#10203B] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1a3157]"
                >
                  Open public profile
                  <ExternalLink className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4C7D9D]">
                  Alerts
                </p>
                <p className="mt-2 text-sm text-slate-500">Latest updates only.</p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("notifications")}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#4C7D9D]"
              >
                View all
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {topAlerts.length > 0 ? (
                topAlerts.map((item) => {
                  const meta = getNotificationMeta(item);

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#10203B]">
                            {item.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">
                            {item.description}
                          </p>
                        </div>

                        {item.unread ? (
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#4C7D9D]" />
                        ) : null}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.categoryClassName}`}
                        >
                          {meta.categoryLabel}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${meta.priorityClassName}`}
                        >
                          {meta.priorityLabel}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-[#F8FAFC] p-5 text-sm text-slate-500">
                  No new alerts.
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#4C7D9D]">
              At a glance
            </p>

            <div className="mt-4 space-y-2">
              <OverviewButton
                label="Certificates"
                value={
                  certificates.length > 0
                    ? `${certificates.length} record(s)`
                    : "No files yet"
                }
                onClick={() => setActiveTab("certificates")}
              />

              <OverviewButton
                label="Billing"
                value={
                  billingEntries.length > 0
                    ? `${billingEntries.length} payment record(s)`
                    : "No payment history"
                }
                onClick={() => setActiveTab("billing")}
              />

              <OverviewButton
                label="Events"
                value={
                  dashboardEvents.length > 0
                    ? `${dashboardEvents.length} event option(s)`
                    : "No upcoming events"
                }
                onClick={() => setActiveTab("events")}
              />
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function OverviewButton({
  label,
  value,
  onClick,
}: {
  label: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 rounded-2xl bg-[#F8FAFC] px-4 py-3 text-left transition hover:bg-[#EEF5FB]"
    >
      <div>
        <p className="text-sm font-semibold text-[#10203B]">{label}</p>
        <p className="mt-1 text-sm text-slate-500">{value}</p>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
    </button>
  );
}
