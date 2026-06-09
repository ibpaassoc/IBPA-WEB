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
          "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium",
          "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isActive
            ? "bg-[rgba(255,255,255,0.06)] text-[var(--sidebar-foreground)]"
            : "text-[var(--sidebar-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--sidebar-foreground)]",
        )}
        href={item.href}
        onClick={onNavigate}
      >
        {isActive ? (
          <span
            aria-hidden
            className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full"
            style={{ backgroundColor: "var(--accent-copper-soft)" }}
          />
        ) : null}
        <item.icon
          className={cn(
            "size-[15px] shrink-0 transition-colors",
            isActive ? "text-[var(--accent-copper-soft)]" : "text-[var(--sidebar-muted)] group-hover:text-[var(--sidebar-foreground)]",
          )}
        />
        <span>{item.label}</span>
      </Link>
    );
  }

  return (
    <Collapsible.Root onOpenChange={setOpen} open={open}>
      <Collapsible.Trigger
        className={cn(
          "group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition-all duration-300",
          isActive || isChildActive
            ? "bg-[rgba(255,255,255,0.06)] text-[var(--sidebar-foreground)]"
            : "text-[var(--sidebar-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--sidebar-foreground)]",
        )}
      >
        <item.icon className="size-[15px] shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 transition-transform duration-300",
            open && "rotate-90",
          )}
        />
      </Collapsible.Trigger>

      <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-[collapsible-up_220ms_ease] data-[state=open]:animate-[collapsible-down_260ms_ease]">
        <div className="ml-3.5 mt-1 flex flex-col gap-0.5 border-l border-[var(--sidebar-border)] pl-3">
          {item.children?.map((child) => {
            const childActive = isAdminLinkActive(pathname, child.href);
            return (
              <Link
                aria-current={childActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] transition-all duration-200",
                  childActive
                    ? "font-medium text-[var(--accent-copper-soft)]"
                    : "font-normal text-[var(--sidebar-muted)] hover:text-[var(--sidebar-foreground)]",
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
    <nav className={cn("flex flex-col gap-1", className)}>
      {adminNavGroups.map((group, index) => (
        <div className="flex flex-col gap-0.5" key={group.label ?? `group-${index}`}>
          {group.label ? (
            <p
              className="mb-1.5 mt-4 px-3.5 font-serif text-[11px] italic"
              style={{ color: "var(--accent-copper-soft)", letterSpacing: "0.01em" }}
            >
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
