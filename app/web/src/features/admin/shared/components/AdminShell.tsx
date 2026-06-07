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
    <div className="flex min-h-dvh bg-background">
      <AdminSidebar />
      <AdminMobileNav onClose={() => setIsMobileNavOpen(false)} open={isMobileNavOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl lg:px-6">
          <button
            aria-label="Open navigation menu"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
            onClick={() => setIsMobileNavOpen(true)}
            type="button"
          >
            <Menu className="size-4" />
          </button>

          <div className="min-w-0 max-w-md flex-1">
            <AdminGlobalSearch />
          </div>

          <div className="shrink-0 lg:hidden">
            <UserButton
              appearance={{
                elements: { userButtonAvatarBox: "size-9 border border-border shadow-sm" },
              }}
            />
          </div>
        </header>

        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
