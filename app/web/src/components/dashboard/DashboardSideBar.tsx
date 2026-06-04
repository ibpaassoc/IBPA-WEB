"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { SectionCard, NavButton } from "../../shared/components/DashboardShared";
import type { TabType } from "./dashboard-types";

type NavItem = {
  key: TabType;
  label: string;
  icon: React.ReactNode;
  accent?: React.ReactNode;
};

type Props = {
  navItems: NavItem[];
  activeTab: TabType;
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  fullName: string;
  memberIdDisplay: string;
};

export function DashboardSidebar({
  navItems,
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  fullName,
  memberIdDisplay,
}: Props) {
  const navContent = (
    <nav className="space-y-2">
      {navItems.map((item) => (
        <NavButton
          key={item.key}
          active={activeTab === item.key}
          label={item.label}
          icon={item.icon}
          accent={item.accent}
          onClick={() => {
            setActiveTab(item.key);
            setIsMobileMenuOpen(false);
          }}
        />
      ))}
    </nav>
  );

  return (
    <>
      <AnimatePresence>
        {isMobileMenuOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/25 backdrop-blur-sm md:hidden"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[300px] flex-col bg-white px-5 py-5 shadow-2xl md:hidden"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#4C7D9D]">
                    IBPA
                  </p>
                  <p className="text-lg font-semibold tracking-tight text-[#10203B]">
                    Navigation
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto">{navContent}</div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <aside className="hidden lg:block">
        <div className="sticky top-[104px] space-y-4">
          <SectionCard className="p-4">
            <div className="mb-4 rounded-[24px] bg-[linear-gradient(135deg,#10203B_0%,#284872_100%)] p-4 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                Current member
              </p>
              <p className="mt-2 text-lg font-semibold">{fullName}</p>
              <p className="mt-1 text-sm text-white/75">{memberIdDisplay}</p>
            </div>

            {navContent}
          </SectionCard>
        </div>
      </aside>
    </>
  );
}
