"use client";

import { SignOutButton, UserButton } from "@clerk/nextjs";
import { AnimatePresence, motion } from "motion/react";
import { Bell, LayoutDashboard, LogIn, Menu } from "lucide-react";
import Link from "next/link";

import { dashboardShellContainerClassName } from "@/shared/components/DashboardShared";
import type { DashboardNotification } from "@/lib/notifications";

type Props = {
  userLoaded: boolean;
  isSignedIn: boolean;
  unreadNotificationsCount: number;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  alertCards: DashboardNotification[];
};

export function DashboardHeader({
  userLoaded,
  isSignedIn,
  unreadNotificationsCount,
  isNotificationsOpen,
  setIsNotificationsOpen,
  setIsMobileMenuOpen,
  alertCards,
}: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 backdrop-blur-xl">
      <div className={`${dashboardShellContainerClassName} flex items-center justify-between gap-4 py-4`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#10203B] text-white shadow-[0_12px_30px_rgba(16,32,59,0.18)]">
            <LayoutDashboard className="h-5 w-5" />
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4C7D9D]">
              IBPA
            </p>
            <p className="text-lg font-semibold tracking-tight text-[#10203B]">
              Member cabinet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            {/*
            <button
            type="button"
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B]"
            aria-label="Open notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadNotificationsCount > 0 ? (
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#4C7D9D]" />
            ) : null}
          </button> 
            <AnimatePresence>
            {isNotificationsOpen ? (
              <>
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsNotificationsOpen(false)}
                  className="fixed inset-0 z-40 bg-transparent"
                />

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-4 top-20 z-50 w-[min(90vw,420px)] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl md:right-6"
                >
                  <div className="border-b border-slate-100 px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#4C7D9D]">
                      Notifications
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-[#10203B]">
                        Latest updates
                      </h3>

                      {unreadNotificationsCount > 0 ? (
                        <span className="rounded-full bg-[#EAF4FF] px-3 py-1 text-[11px] font-medium text-[#4C7D9D]">
                          {unreadNotificationsCount} new
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="max-h-[360px] space-y-3 overflow-y-auto px-4 py-4">
                    {alertCards.length > 0 ? (
                      alertCards.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl bg-[#F8FAFC] px-4 py-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-[#10203B]">
                                {item.title}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-slate-500">
                                {item.description}
                              </p>
                            </div>

                            {item.unread ? (
                              <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#4C7D9D]" />
                            ) : null}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-[#F8FAFC] px-4 py-5 text-sm text-slate-500">
                        No fresh alerts yet.
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-100 px-4 py-4">
                    <Link
                      href="/dashboard/notifications"
                      onClick={() => setIsNotificationsOpen(false)}
                      className={`${dashboardPrimaryButtonClassName} w-full`}
                    >
                      Open notification center
                    </Link>
                  </div>
                </motion.div>
              </>
            ) : null}
          </AnimatePresence> */}
          

          {!userLoaded ? (
            <div className="h-11 w-11 animate-pulse rounded-full bg-slate-100" />
          ) : isSignedIn ? (
            <div className="flex items-center gap-3">
              <SignOutButton>
                <button className="hidden rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#4C7D9D]/40 hover:text-[#10203B] md:inline-flex">
                  Sign out
                </button>
              </SignOutButton>

              <UserButton />
            </div>
          ) : (
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#10203B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1a3157]"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
