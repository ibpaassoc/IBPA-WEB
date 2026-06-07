"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { adminNavGroups, isAdminLinkActive } from "../config/admin-nav";

type AdminSidebarNavProps = {
  onNavigate?: () => void;
  className?: string;
};

export function AdminSidebarNav({ className, onNavigate }: AdminSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-5", className)}>
      {adminNavGroups.map((group, index) => (
        <div className="flex flex-col gap-1" key={group.label ?? `group-${index}`}>
          {group.label ? (
            <p className="px-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {group.label}
            </p>
          ) : null}
          {group.items.map((item) => {
            const Icon = item.icon;
            const isActive = isAdminLinkActive(pathname, item.href);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
                )}
                href={item.href}
                key={item.href}
                onClick={onNavigate}
              >
                <Icon className="size-4" data-icon="inline-start" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
