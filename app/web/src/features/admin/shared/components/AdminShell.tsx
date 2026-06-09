"use client";

import { UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import { AdminGlobalSearch } from "../../search/components/AdminGlobalSearch";
import { AdminMobileNav } from "./AdminMobileNav";
import { AdminSidebar } from "./AdminSidebar";

type AdminShellProps = {
  children: ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="admin-theme relative isolate flex min-h-dvh bg-background text-foreground">
      {/* Ambient warm aurora */}
      <div aria-hidden className="admin-aurora" />

      <AdminSidebar />
      <AdminMobileNav onClose={() => setIsMobileNavOpen(false)} open={isMobileNavOpen} />

      <div className="relative z-[1] flex min-w-0 flex-1 flex-col">
        <header
          className="glass sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-x-0 border-t-0 px-5 lg:px-10"
        >
          <button
            aria-label="Open navigation menu"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--hairline)] bg-white/70 text-muted-foreground transition-all hover:border-[var(--hairline-strong)] hover:text-foreground lg:hidden"
            onClick={() => setIsMobileNavOpen(true)}
            type="button"
          >
            <Menu className="size-4" />
          </button>

          <div className="min-w-0 max-w-md flex-1">
            <AdminGlobalSearch />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <span className="hidden text-xs italic tracking-tight text-muted-foreground lg:inline">
              <span className="editorial-eyebrow">IBPA</span> &nbsp;· Editorial workspace
            </span>
            <span className="hidden h-6 w-px bg-[var(--hairline)] lg:inline-block" />
            <UserButton
              appearance={{
                elements: {
                  userButtonAvatarBox: "size-9 ring-1 ring-[var(--hairline)]",
                },
              }}
            />
          </div>
        </header>

        <main className="relative flex-1">{children}</main>
      </div>
    </div>
  );
}
