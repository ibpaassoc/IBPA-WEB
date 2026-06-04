import Link from "next/link";
import { ExternalLink } from "lucide-react";

import {
  dashboardSecondaryButtonClassName,
  dashboardSubtlePanelClassName,
  SectionCard,
  SectionHeader,
} from "@/shared/components/DashboardShared";
import type {
  NotificationPreferenceKey,
  NotificationPreferences,
} from "@/lib/dashboard-cabinet";
import type { DashboardNotification } from "@/lib/notifications";

type NotificationMeta = {
  categoryLabel: string;
  priorityLabel: string;
  categoryClassName: string;
  priorityClassName: string;
};

export function DashboardNotifications({
  allNotifications,
  getNotificationMeta,
  notificationPreferences,
  togglePreference,
}: {
  allNotifications: DashboardNotification[];
  getNotificationMeta: (notification: DashboardNotification) => NotificationMeta;
  notificationPreferences: NotificationPreferences;
  togglePreference: (key: NotificationPreferenceKey) => void;
}) {
  return (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          title="Notifications"
          action={
            <Link href="/dashboard/notifications" className={dashboardSecondaryButtonClassName}>
              Open Full Page
              <ExternalLink className="h-4 w-4" />
            </Link>
          }
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            {allNotifications.length > 0 ? (
              allNotifications.map((item) => {
                const meta = getNotificationMeta(item);

                return (
                  <article
                    key={item.id}
                    className="rounded-[22px] border border-slate-200 bg-white px-5 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-2">
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

                        <p className="mt-3 text-base font-semibold text-slate-900">
                          {item.title}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {item.description}
                        </p>

                        <p className="mt-3 text-xs text-slate-400">
                          {new Date(item.timestamp).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      {item.unread ? (
                        <span className="mt-1 size-2.5 shrink-0 rounded-full bg-[#4C7D9D]" />
                      ) : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-[22px] border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
                No notifications yet.
              </div>
            )}
          </div>

          <aside className={`${dashboardSubtlePanelClassName} p-5`}>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">
              Preferences
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Adjust how these notification categories appear in this dashboard.
            </p>

            <div className="mt-4 space-y-3">
              {[
                { key: "applicationUpdates" as const, label: "Application updates" },
                { key: "certificateReminders" as const, label: "Certificate reminders" },
                { key: "membershipRenewal" as const, label: "Membership renewal" },
                { key: "eventInvitations" as const, label: "Event invitations" },
                { key: "supportReplies" as const, label: "Support replies" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => togglePreference(item.key)}
                  className="flex w-full items-center justify-between rounded-[20px] border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-[#4C7D9D]/30"
                >
                  <span className="text-sm font-medium text-slate-900">
                    {item.label}
                  </span>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${
                      notificationPreferences[item.key]
                        ? "bg-[#EAF4FF] text-[#4C7D9D]"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {notificationPreferences[item.key] ? "On" : "Off"}
                  </span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </SectionCard>
    </div>
  );
}
