"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { adminNavGroups, isAdminLinkActive, type AdminNavLink } from "../config/admin-nav";

type AdminSidebarNavProps = {
  onNavigate?: () => void;
  className?: string;
};

function NavItem({
  item,
  isActive,
  onNavigate,
}: {
  item: AdminNavLink;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const hasChildren = !!item.children?.length;
  const isChildActive = item.children?.some((c) => isAdminLinkActive(pathname, c.href)) ?? false;
  const [open, setOpen] = useState(isActive || isChildActive);

  useEffect(() => {
    if (isActive || isChildActive) setOpen(true);
  }, [isActive, isChildActive]);

  if (!hasChildren) {
    return (
      <Link
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-[#5a6b7a] hover:bg-sidebar-accent hover:text-foreground",
        )}
        href={item.href}
        onClick={onNavigate}
      >
        <item.icon className="size-4 shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <Collapsible.Root onOpenChange={setOpen} open={open}>
      <Collapsible.Trigger
        className={cn(
          "group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
          isActive || isChildActive
            ? "bg-sidebar-accent text-foreground"
            : "text-[#5a6b7a] hover:bg-sidebar-accent hover:text-foreground",
        )}
      >
        <item.icon className="size-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-90",
          )}
        />
      </Collapsible.Trigger>

      <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-[collapsible-up_150ms_ease] data-[state=open]:animate-[collapsible-down_150ms_ease]">
        <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-border pl-3">
          {item.children?.map((child) => {
            const childActive = isAdminLinkActive(pathname, child.href);
            return (
              <Link
                aria-current={childActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-all duration-150",
                  childActive
                    ? "font-medium text-primary"
                    : "font-normal text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
                href={child.href}
                key={child.href}
                onClick={onNavigate}
              >
                <child.icon className="size-3.5 shrink-0" />
                <span>{child.label}</span>
              </Link>
            );
          })}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

export function AdminSidebarNav({ className, onNavigate }: AdminSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-0.5", className)}>
      {adminNavGroups.map((group, index) => (
        <div className="flex flex-col gap-0.5" key={group.label ?? `group-${index}`}>
          {group.label ? (
            <p className="mb-1 mt-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </p>
          ) : null}
          {group.items.map((item) => (
            <NavItem
              isActive={isAdminLinkActive(pathname, item.href)}
              item={item}
              key={item.href}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}
