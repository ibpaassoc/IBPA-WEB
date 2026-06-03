"use client";

import { AnimatePresence, motion } from "motion/react";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSideBar";
import { DashboardPageHero } from "./DashboardPageHero";
import { DashboardContent } from "./DashboardContent";
import type { TabType } from "./dashboard-types";
import type { DashboardNotification } from "@/lib/notifications";

type Props = {
  userLoaded: boolean;
  isSignedIn: boolean;
  unreadNotificationsCount: number;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  alertCards: DashboardNotification[];

  navItems: any[];
  activeTab: TabType;
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
  isMobileMenuOpen: boolean;
  fullName: string;
  memberIdDisplay: string;

  statusLabel: string;
  memberSinceDisplay: string;
  lastSyncedAt: string | null;

  contentProps: React.ComponentProps<typeof DashboardContent>;
};

export function DashboardLayout({
  userLoaded,
  isSignedIn,
  unreadNotificationsCount,
  isNotificationsOpen,
  setIsNotificationsOpen,
  setIsMobileMenuOpen,
  alertCards,
  navItems,
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  fullName,
  memberIdDisplay,
  statusLabel,
  memberSinceDisplay,
  lastSyncedAt,
  contentProps,
}: Props) {
  return (
    <div className="min-h-screen bg-[#F4F7FB] text-slate-900">
      <DashboardHeader
        userLoaded={userLoaded}
        isSignedIn={isSignedIn}
        unreadNotificationsCount={unreadNotificationsCount}
        isNotificationsOpen={isNotificationsOpen}
        setIsNotificationsOpen={setIsNotificationsOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        alertCards={alertCards}
      />

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-6 md:py-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <DashboardSidebar
          navItems={navItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          fullName={fullName}
          memberIdDisplay={memberIdDisplay}
        />

        <section className="space-y-6">

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <DashboardContent {...contentProps} />
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}
