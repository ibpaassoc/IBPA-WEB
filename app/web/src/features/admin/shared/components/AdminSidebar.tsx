"use client";

import { useUser } from "@clerk/nextjs";
import { Sparkles } from "lucide-react";
import Link from "next/link";

import { AdminSidebarNav } from "./AdminSidebarNav";

export function AdminSidebar() {
  const { user } = useUser();

  return (
    <aside className="hidden shrink-0 border-r border-border bg-sidebar lg:flex lg:w-72 lg:flex-col">
      <div className="p-3">
        <Link
          className="flex items-center gap-3 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_18%_0%,rgba(114,160,193,0.35),transparent_38%),linear-gradient(135deg,#10203b_0%,#284872_100%)] px-4 py-4 text-white shadow-[0_18px_35px_rgba(16,32,59,0.22)] transition hover:shadow-[0_22px_42px_rgba(16,32,59,0.28)]"
          href="/admin"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/12 text-white backdrop-blur-sm">
            <Sparkles className="size-5" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/60">IBPA</span>
            <span className="truncate text-base font-semibold tracking-tight">Admin workspace</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <AdminSidebarNav />
      </div>

      <div className="flex items-center gap-2.5 border-t border-sidebar-border px-4 py-3.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#21466d_0%,#2b5c99_100%)] text-xs font-semibold text-white shadow-sm">
          {(user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "A").slice(0, 1).toUpperCase()}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {user?.fullName || "Admin"}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {user?.primaryEmailAddress?.emailAddress || "Signed in"}
          </span>
        </div>
      </div>
    </aside>
  );
}
