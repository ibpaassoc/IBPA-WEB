"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import {
  adminNavGroups,
  isAdminLinkActive,
  type AdminNavLink,
} from "../config/admin-nav";

type AdminSidebarNavProps = {
  onNavigate?: () => void;
  className?: string;
};

type Indicator = {
  top: number;
  height: number;
};

function getActiveHref(pathname: string) {
  for (const group of adminNavGroups) {
    for (const item of group.items) {
      const activeChild = item.children?.find((child) =>
        isAdminLinkActive(pathname, child.href),
      );

      if (activeChild) return activeChild.href;

      if (isAdminLinkActive(pathname, item.href)) {
        return item.href;
      }
    }
  }

  return null;
}

function NavItem({
  item,
  isActive,
  activeHref,
  onNavigate,
  registerItemRef,
}: {
  item: AdminNavLink;
  isActive: boolean;
  activeHref: string | null;
  onNavigate?: () => void;
  registerItemRef: (href: string, node: HTMLElement | null) => void;
}) {
  const pathname = usePathname();
  const hasChildren = !!item.children?.length;
  const isChildActive =
    item.children?.some((child) => isAdminLinkActive(pathname, child.href)) ??
    false;

  const [open, setOpen] = useState(isActive || isChildActive);

  if (!hasChildren) {
    return (
      <a
        ref={(node) => registerItemRef(item.href, node)}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group relative z-[1] flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13.5px] font-semibold",
          "transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isActive
            ? "text-white"
            : "text-[#55708F] hover:text-[#10203B]",
        )}
        href={item.href}
        onClick={onNavigate}
      >
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
            isActive
              ? "bg-white/14 text-white"
              : "bg-[#EEF5FF] text-[#21466D] group-hover:bg-[#E3EFFC]",
          )}
        >
          <item.icon className="size-[15px]" />
        </span>

        <span className="truncate">{item.label}</span>
      </a>
    );
  }

  return (
    <Collapsible.Root onOpenChange={setOpen} open={open}>
      <Collapsible.Trigger
        ref={(node) => registerItemRef(item.href, node)}
        className={cn(
          "group relative z-[1] flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13.5px] font-semibold",
          "transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          isActive || isChildActive
            ? "text-white"
            : "text-[#55708F] hover:text-[#10203B]",
        )}
      >
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
            isActive || isChildActive
              ? "bg-white/14 text-white"
              : "bg-[#EEF5FF] text-[#21466D] group-hover:bg-[#E3EFFC]",
          )}
        >
          <item.icon className="size-[15px]" />
        </span>

        <span className="flex-1 truncate text-left">{item.label}</span>

        <ChevronRight
          className={cn(
            "size-3.5 shrink-0 transition-transform duration-300",
            open && "rotate-90",
          )}
        />
      </Collapsible.Trigger>

      <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-[collapsible-up_220ms_ease] data-[state=open]:animate-[collapsible-down_260ms_ease]">
        <div className="ml-6 mt-1.5 flex flex-col gap-1 border-l border-[#D9E4F2] pl-4">
          {item.children?.map((child) => {
            const childActive = activeHref === child.href;

            return (
              <a
                ref={(node) => registerItemRef(child.href, node)}
                aria-current={childActive ? "page" : undefined}
                className={cn(
                  "group/child relative z-[1] flex items-center gap-2 rounded-xl px-3 py-2 text-[12.5px]",
                  "transition-colors duration-200",
                  childActive
                    ? "font-semibold text-white"
                    : "font-medium text-[#6B7C93] hover:text-[#10203B]",
                )}
                href={child.href}
                key={child.href}
                onClick={onNavigate}
              >
                <child.icon
                  className={cn(
                    "size-3.5 shrink-0 transition-colors",
                    childActive
                      ? "text-white"
                      : "text-[#8AA2BD] group-hover/child:text-[#21466D]",
                  )}
                />
                <span className="truncate">{child.label}</span>
              </a>
            );
          })}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}

export function AdminSidebarNav({
  className,
  onNavigate,
}: AdminSidebarNavProps) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const [indicator, setIndicator] = useState<Indicator | null>(null);

  const activeHref = getActiveHref(pathname);

  const registerItemRef = (href: string, node: HTMLElement | null) => {
    if (!node) {
      itemRefs.current.delete(href);
      return;
    }

    itemRefs.current.set(href, node);
  };

  useLayoutEffect(() => {
    if (!activeHref || !navRef.current) return;

    const activeNode = itemRefs.current.get(activeHref);
    if (!activeNode) return;

    const navRect = navRef.current.getBoundingClientRect();
    const activeRect = activeNode.getBoundingClientRect();

    setIndicator({
      top: activeRect.top - navRect.top,
      height: activeRect.height,
    });
  }, [activeHref, pathname]);

  return (
    <nav
      ref={navRef}
      className={cn("relative flex flex-col gap-1.5", className)}
    >
      {indicator ? (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 z-0 rounded-2xl bg-[#0B1F44] shadow-[0_14px_34px_rgba(11,31,68,0.18)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            height: indicator.height,
            transform: `translateY(${indicator.top}px)`,
          }}
        />
      ) : null}

      {adminNavGroups.map((group, index) => (
        <div
          className="relative z-[1] flex flex-col gap-1"
          key={group.label ?? `group-${index}`}
        >
          {group.label ? (
            <p className="mb-1 mt-4 px-3.5 text-[10px] font-bold uppercase tracking-[0.28em] text-[#7A94B2]">
              {group.label}
            </p>
          ) : null}

          {group.items.map((item) => (
            <NavItem
              activeHref={activeHref}
              isActive={isAdminLinkActive(pathname, item.href)}
              item={item}
              key={item.href}
              onNavigate={onNavigate}
              registerItemRef={registerItemRef}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}
