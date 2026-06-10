"use client";

import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import { AdminMobileNav } from "./AdminMobileNav";
import { AdminSidebar } from "./AdminSidebar";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div
      className="admin-theme min-h-screen bg-[#F4F7FB] text-slate-900"
      style={{ scrollbarGutter: "stable both-edges" }}
    >
      <div aria-hidden className="admin-aurora" />

      <AdminMobileNav
        onClose={() => setIsMobileNavOpen(false)}
        open={isMobileNavOpen}
      />

      <button
        aria-label="Open navigation menu"
        className="fixed left-5 top-5 z-40 flex size-10 items-center justify-center rounded-full border border-[#D4E0F0] bg-white/85 text-[#21466D] shadow-sm backdrop-blur-xl transition-all hover:border-[#9FB7D5] hover:text-[#0B1F44] lg:hidden"
        onClick={() => setIsMobileNavOpen(true)}
        type="button"
      >
        <Menu className="size-4" />
      </button>

      <main className="mx-auto flex w-full max-w-[1600px] gap-6 px-5 py-6 lg:px-8">
        <AdminSidebar />

        <section className="min-w-0 flex-1 space-y-6">{children}</section>
      </main>
    </div>
  );
}
