"use client";

import { UserButton } from "@clerk/nextjs";
import {
  CalendarDays,
  ClipboardList,
  Mail,
  Newspaper,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/applications", label: "Applications", icon: ClipboardList },
  { href: "/admin/profiles", label: "Profiles", icon: Users },
  { href: "/admin/articles", label: "Articles", icon: Newspaper },
  { href: "/admin/events", label: "Events", icon: CalendarDays },
  { href: "/admin/mailing", label: "Mailing", icon: Mail },
] as const;

export function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
          <Link
            className="flex w-fit items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground"
            href="/admin"
          >
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles data-icon="inline-start" />
            </span>
            IBPA Admin
          </Link>
          <nav className="flex gap-1 overflow-x-auto pb-1 lg:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname.startsWith(item.href) ||
                (pathname === "/admin" && item.href === "/admin/applications");

              return (
                <Link
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    isActive && "bg-primary/10 text-primary",
                  )}
                  href={item.href}
                  key={item.href}
                >
                  <Icon data-icon="inline-start" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="shrink-0">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "size-9 border border-border shadow-sm",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
