"use client";

import { AnimatePresence, motion } from "motion/react";
import { Sparkles, X } from "lucide-react";

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
            className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            animate={{ x: 0 }}
            className="fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-[300px] flex-col border-r border-border bg-card shadow-2xl lg:hidden"
            exit={{ x: "-100%" }}
            initial={{ x: "-100%" }}
            transition={{ damping: 28, stiffness: 260, type: "spring" }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <span className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-foreground">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="size-4" />
                </span>
                IBPA Admin
              </span>
              <button
                aria-label="Close navigation menu"
                className="flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={onClose}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <AdminSidebarNav onNavigate={onClose} />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
