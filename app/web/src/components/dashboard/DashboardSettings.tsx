import { UserProfile } from "@clerk/nextjs";
import { CheckCircle2, LogIn } from "lucide-react";

import { SectionCard, SectionHeader } from "@/components/dashboard/DashboardShared";
import type { NotificationPreferences } from "@/lib/dashboard-cabinet";

export function DashboardSettings({
  isSignedIn,
  notificationPreferences,
}: {
  isSignedIn: boolean;
  notificationPreferences: NotificationPreferences;
}) {
  return (
    <div className="space-y-6">
      <SectionCard>
        <SectionHeader
          eyebrow="Settings"
          title="Account settings"
          description="Email settings, password and account management, notification preferences, and profile safety controls using the current auth stack."
        />

        <div className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">
                Included today
              </p>

              <div className="mt-4 space-y-3">
                {[
                  "Email and account settings via the existing Clerk profile surface.",
                  "Password and security options where supported by your sign-in method.",
                  "Delete account only if it is enabled in the current auth configuration.",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl bg-white px-4 py-4 text-sm text-slate-600"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-[#FBFCFE] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">
                Notification preferences
              </p>

              <div className="mt-4 space-y-3">
                {Object.entries(notificationPreferences).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-2xl bg-white px-4 py-3"
                  >
                    <span className="text-sm capitalize text-[#10203B]">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                        value
                          ? "bg-[#EAF4FF] text-[#4C7D9D]"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {value ? "Enabled" : "Muted"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-3">
            {isSignedIn ? (
              <UserProfile routing="hash" />
            ) : (
              <div className="flex min-h-[420px] items-center justify-center">
                <div className="text-center">
                  <LogIn className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="mt-4 text-lg font-semibold text-[#10203B]">
                    Authentication required
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
