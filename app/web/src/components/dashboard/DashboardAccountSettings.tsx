"use client";

import { SignInButton, UserProfile, useUser } from "@clerk/nextjs";
import { SectionCard } from "@/shared/components/DashboardShared";
import { useI18n } from "@/lib/i18n";

export function DashboardAccountSettings() {
  const { isSignedIn } = useUser();
  const { t } = useI18n();

  return (
    <div className="min-w-0 space-y-5">
      {isSignedIn ? (
        <SectionCard className="min-w-0 overflow-hidden p-0">
          <div className="w-full min-w-0 overflow-x-auto">
            <div className="min-w-0">
              <UserProfile
                routing="hash"
                appearance={{
                  elements: {
                    rootBox: "w-full min-w-0",
                    cardBox: "w-full min-w-0 shadow-none",
                    card: "w-full min-w-0 max-w-none rounded-none border-0 shadow-none",
                    navbar:
                      "bg-[#F8FBFF] border-b border-[#D4E0F0] md:border-b-0 md:border-r",
                    navbarButtons: "gap-2",
                    navbarMobileMenuButton:
                      "text-[#10203B] hover:bg-[#EAF2FD]",
                    pageScrollBox: "min-w-0 p-0",
                    page: "min-h-[560px] min-w-0",
                    headerTitle: "text-[#10203B]",
                    headerSubtitle: "text-slate-500",
                    profileSectionTitleText: "text-[#10203B]",
                    profileSectionContent: "text-[#10203B]",
                    formButtonPrimary:
                      "rounded-xl bg-[#10203B] text-white hover:bg-[#1A3157]",
                    formFieldInput:
                      "rounded-xl border-[#D4E0F0] focus:border-[#72A0C1] focus:ring-[#72A0C1]/20",
                    footer: "bg-[#F8FBFF]",
                  },
                  variables: {
                    colorPrimary: "#10203B",
                    colorText: "#10203B",
                    colorTextSecondary: "#64748B",
                    borderRadius: "1rem",
                  },
                }}
              />
            </div>
          </div>
        </SectionCard>
      ) : (
        <section className="max-w-[760px] rounded-[32px] border border-[#D4E0F0] bg-white/95 p-5 shadow-[0_22px_60px_rgba(11,31,68,0.09)]">
          <div className="rounded-[28px] border border-dashed border-[#D4E0F0] bg-[#F8FBFF] px-6 py-10 text-center">
            <p className="text-base font-semibold text-[#10203B]">
              {t.dashboard.account.signInTitle}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {t.dashboard.account.signInDescription}
            </p>

            <div className="mt-5">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#10203B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1A3157]"
                >
                  {t.dashboard.account.signIn}
                </button>
              </SignInButton>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
