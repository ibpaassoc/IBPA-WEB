import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { SectionCard, SectionHeader } from "@/components/dashboard/DashboardShared";
import type { NotificationPreferenceKey, NotificationPreferences } from "@/lib/dashboard-cabinet";
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
          eyebrow="Notifications"
          title="Updates and notification preferences"
          description="Application updates, support replies, renewal reminders, and new member opportunities in one calm space."
          action={
            <Link
              href="/dashboard/notifications"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B]"
            >
              Open full notifications page
              <ExternalLink className="h-4 w-4" />
            </Link>
          }
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            {allNotifications.length > 0 ? (
              allNotifications.map((item) => {
                const meta = getNotificationMeta(item);

                return (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-slate-200 bg-[#FBFCFE] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
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

                        <p className="mt-4 text-lg font-semibold text-[#10203B]">
                          {item.title}
                        </p>

                        <p className="mt-2 text-sm leading-7 text-slate-500">
                          {item.description}
                        </p>

                        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-400">
                          {new Date(item.timestamp).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      {item.unread ? (
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#4C7D9D]" />
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[24px] border border-dashed border-slate-200 bg-[#FBFCFE] p-6 text-sm text-slate-500">
                No notifications yet.
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">
              Preference center
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              These toggles are stored in this browser today and keep the UI ready for account-level notification settings later.
            </p>

            <div className="mt-5 space-y-3">
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
                  className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-4 text-left"
                >
                  <span className="text-sm font-medium text-[#10203B]">
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
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
