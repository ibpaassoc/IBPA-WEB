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
    <div className="admin-theme flex min-h-dvh bg-background">
      <AdminSidebar />
      <AdminMobileNav onClose={() => setIsMobileNavOpen(false)} open={isMobileNavOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-white/80 px-4 backdrop-blur-xl lg:px-5">
          <button
            aria-label="Open navigation menu"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
            onClick={() => setIsMobileNavOpen(true)}
            type="button"
          >
            <Menu className="size-4" />
          </button>

          <div className="min-w-0 max-w-sm flex-1">
            <AdminGlobalSearch />
          </div>

          <div className="ml-auto shrink-0">
            <UserButton
              appearance={{
                elements: { userButtonAvatarBox: "size-8" },
              }}
            />
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
