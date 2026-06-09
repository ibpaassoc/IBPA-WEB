"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";

import { AdminSidebarNav } from "./AdminSidebarNav";

export function AdminSidebar() {
  const { user } = useUser();
  const initials = (user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "A")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className="relative hidden shrink-0 flex-col bg-[var(--sidebar)] text-[var(--sidebar-foreground)] lg:flex lg:w-72"
      style={{
        backgroundImage:
          "radial-gradient(120% 30% at 0% 0%, rgba(185,122,62,0.10), transparent 60%), radial-gradient(80% 20% at 100% 100%, rgba(208,188,154,0.08), transparent 70%)",
      }}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-7">
        <Link
          className="group flex items-center gap-3 focus-visible:outline-none"
          href="/admin"
        >
          <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] transition-all group-hover:border-[var(--accent-copper-soft)]">
            <span className="font-serif text-base italic text-[var(--sidebar-foreground)]">
              I
            </span>
            <span
              aria-hidden
              className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(217,156,94,0.35), transparent 70%)",
              }}
            />
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-serif text-base font-medium tracking-tight">
              IBPA
            </span>
            <span className="text-[11px] tracking-tight text-[var(--sidebar-muted)]">
              Editorial workspace
            </span>
          </div>
        </Link>
      </div>

      <div className="mx-7 h-px bg-[var(--sidebar-border)]" />

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <AdminSidebarNav />
      </div>

      <div className="mx-7 h-px bg-[var(--sidebar-border)]" />

      {/* User footer */}
      <div className="flex shrink-0 items-center gap-3 px-7 py-5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.06)] text-xs font-medium"
          style={{ color: "var(--accent-copper-soft)" }}
        >
          {initials}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">
            {user?.fullName || "Admin"}
          </span>
          <span className="truncate text-xs text-[var(--sidebar-muted)]">
            {user?.primaryEmailAddress?.emailAddress || "Signed in"}
          </span>
        </div>
      </div>
    </aside>
  );
}
