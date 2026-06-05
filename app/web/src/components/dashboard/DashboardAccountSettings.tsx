"use client";

import { SignInButton, UserProfile, useUser } from "@clerk/nextjs";

const shellCardClassName =
  "rounded-[32px] border border-[#D4E0F0] bg-white/95 p-5 shadow-[0_22px_60px_rgba(11,31,68,0.09)]";

export function DashboardAccountSettings() {
  const { isSignedIn } = useUser();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#21466D]">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#10203B]">
          Account settings
        </h1>
      </div>

      <section className={shellCardClassName}>
        {isSignedIn ? (
          <div className="mx-auto max-w-[1120px] rounded-[28px] border border-[#D4E0F0] bg-[radial-gradient(circle_at_top,rgba(111,162,212,0.12),transparent_28%),linear-gradient(180deg,#F8FBFF_0%,#FDFEFF_100%)] p-2 sm:p-3 lg:p-4">
            <div className="overflow-x-auto rounded-[24px] border border-white/80 bg-white/85 shadow-[0_16px_40px_rgba(11,31,68,0.06)]">
              <div className="min-w-0">
                <UserProfile
                  routing="hash"
                  appearance={{
                    elements: {
                      rootBox: "w-full min-w-0",
                      cardBox: "w-full",
                      card: "w-full max-w-none border-0 bg-transparent shadow-none",
                      navbar: "shrink-0",
                      pageScrollBox: "w-full",
                    },
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-[#D4E0F0] bg-[#F8FBFF] px-6 py-10 text-center">
            <p className="text-base font-semibold text-[#10203B]">
              Sign in to manage account settings
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your Clerk profile, security, and account preferences appear here once you are signed in.
            </p>
            <div className="mt-5">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#10203B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1a3157]"
                >
                  Sign in
                </button>
              </SignInButton>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
