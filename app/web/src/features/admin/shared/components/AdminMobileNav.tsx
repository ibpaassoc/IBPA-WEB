"use client";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

import { AdminSidebarNav } from "./AdminSidebarNav";

type AdminMobileNavProps = {
  open: boolean;
  onClose: () => void;
};

export function AdminMobileNav({ onClose, open }: AdminMobileNavProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-40 bg-[rgba(20,14,8,0.55)] backdrop-blur-md lg:hidden"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            animate={{ x: 0 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-[300px] flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)] shadow-[var(--shadow-deep)] lg:hidden"
            exit={{ x: "-100%" }}
            initial={{ x: "-100%" }}
            transition={{ damping: 30, stiffness: 280, type: "spring" }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between px-5">
              <span className="flex items-center gap-3 text-sm font-medium">
                <span className="flex size-9 items-center justify-center rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] font-serif italic">
                  I
                </span>
                <span className="flex flex-col leading-none">
                  <span className="font-serif text-base tracking-tight">IBPA</span>
                  <span className="text-[11px] text-[var(--sidebar-muted)]">Workspace</span>
                </span>
              </span>
              <button
                aria-label="Close navigation menu"
                className="flex size-9 items-center justify-center rounded-full border border-[rgba(255,255,255,0.12)] text-[var(--sidebar-muted)] transition-all hover:rotate-90 hover:text-[var(--sidebar-foreground)]"
                onClick={onClose}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mx-5 h-px bg-[var(--sidebar-border)]" />
            <div className="flex-1 overflow-y-auto px-4 py-5">
              <AdminSidebarNav onNavigate={onClose} />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
