"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { PanelRightOpen, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type AdminSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  eyebrow?: string;
  description?: string;
  actions?: ReactNode;
  leftRail?: ReactNode;
  rightRail?: ReactNode;
  sideRail?: ReactNode;
  children: ReactNode;
  className?: string;
  size?: "md" | "lg" | "xl";
};

const sizeMap = {
  md: "max-w-3xl",
  lg: "max-w-6xl",
  xl: "max-w-[min(1680px,calc(100vw-1rem))]",
};

export function AdminSheet({
  open,
  onOpenChange,
  title,
  eyebrow,
  description,
  actions,
  leftRail,
  rightRail,
  sideRail,
  children,
  className,
  size = "xl",
}: AdminSheetProps) {
  const resolvedLeftRail = leftRail ?? sideRail;
  const [isMobileRightRailOpen, setIsMobileRightRailOpen] = useState(false);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setIsMobileRightRailOpen(false);
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#10203B]/18 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:duration-200 data-[state=closed]:duration-150" />

        <DialogPrimitive.Content
          className={cn(
            "fixed right-2 top-2 z-50 flex h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-[32px]",
            "border border-white/70 bg-[#F4F7FB] shadow-[0_34px_120px_rgba(15,35,70,0.24)]",
            "will-change-transform data-[state=open]:animate-in data-[state=open]:slide-in-from-right-8 data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-8 data-[state=closed]:fade-out-0",
            "data-[state=open]:duration-300 data-[state=closed]:duration-200",
            sizeMap[size],
            className,
          )}
        >
          <div className="flex shrink-0 flex-col gap-4 border-b border-[#D9E4F2] bg-white/90 px-5 py-5 sm:px-7">
            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#8AA2BD]">
                  {eyebrow}
                </p>
              ) : null}

              {title ? (
                <DialogPrimitive.Title className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#10203B] sm:truncate">
                  {title}
                </DialogPrimitive.Title>
              ) : null}

              {description ? (
                <DialogPrimitive.Description className="mt-1 text-sm text-[#6B7C93] sm:truncate">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <div className="flex items-center gap-2">
                {rightRail ? (
                  <button
                    aria-controls="admin-sheet-mobile-sidebar"
                    aria-expanded={isMobileRightRailOpen}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#D9E4F2] bg-white px-4 text-sm font-medium text-[#1F5D8F] shadow-sm transition-all hover:border-[#BDD0E8] hover:bg-[#EEF6FF] hover:text-[#10203B] xl:hidden"
                    onClick={() => setIsMobileRightRailOpen(true)}
                    type="button"
                  >
                    <PanelRightOpen className="size-4" />
                    Actions
                  </button>
                ) : null}

                {actions}
              </div>

              <DialogPrimitive.Close
                aria-label="Close"
                className="flex size-10 items-center justify-center rounded-full border border-[#D9E4F2] bg-white text-[#6B7C93] shadow-sm transition-all hover:border-[#BDD0E8] hover:text-[#10203B]"
              >
                <X className="size-4" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <div className="relative min-h-0 flex-1">
            <div
              className={cn(
                "grid h-full min-h-0 grid-cols-1",
                resolvedLeftRail && rightRail
                  ? "xl:grid-cols-[520px_minmax(0,1fr)_320px]"
                  : resolvedLeftRail
                    ? "xl:grid-cols-[520px_minmax(0,1fr)]"
                    : rightRail
                      ? "xl:grid-cols-[minmax(0,1fr)_320px]"
                      : undefined,
              )}
            >
              {resolvedLeftRail ? (
                <aside className="no-scrollbar hidden min-h-0 overflow-y-auto border-r border-[#D9E4F2] bg-white/60 p-5 xl:block">
                  <div className="admin-sheet-rail">{resolvedLeftRail}</div>
                </aside>
              ) : null}

              <main className="no-scrollbar min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
                <div className="admin-sheet-main">{children}</div>
              </main>

              {rightRail ? (
                <aside className="no-scrollbar hidden min-h-0 overflow-y-auto border-l border-[#D9E4F2] bg-white/60 p-5 xl:block">
                  <div className="admin-sheet-rail">{rightRail}</div>
                </aside>
              ) : null}
            </div>

            {rightRail ? (
              <div
                className={cn(
                  "absolute inset-0 z-20 xl:hidden",
                  isMobileRightRailOpen ? "pointer-events-auto" : "pointer-events-none",
                )}
              >
                <button
                  aria-label="Close actions sidebar"
                  className={cn(
                    "absolute inset-0 bg-[#10203B]/18 transition-opacity duration-300",
                    isMobileRightRailOpen ? "opacity-100" : "opacity-0",
                  )}
                  onClick={() => setIsMobileRightRailOpen(false)}
                  type="button"
                />

                <aside
                  aria-label="Application actions"
                  className={cn(
                    "absolute inset-y-0 right-0 flex w-full max-w-[360px] flex-col border-l border-[#D9E4F2] bg-[#F8FBFF] shadow-[-22px_0_48px_rgba(15,35,70,0.18)] transition-transform duration-300",
                    isMobileRightRailOpen ? "translate-x-0" : "translate-x-full",
                  )}
                  id="admin-sheet-mobile-sidebar"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-[#D9E4F2] bg-white/90 px-5 py-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8AA2BD]">
                        Review workspace
                      </p>
                      <h3 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[#10203B]">
                        Application actions
                      </h3>
                    </div>

                    <button
                      aria-label="Close actions sidebar"
                      className="flex size-10 items-center justify-center rounded-full border border-[#D9E4F2] bg-white text-[#6B7C93] shadow-sm transition-all hover:border-[#BDD0E8] hover:text-[#10203B]"
                      onClick={() => setIsMobileRightRailOpen(false)}
                      type="button"
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="no-scrollbar flex-1 overflow-y-auto p-5">
                    <div className="admin-sheet-rail">{rightRail}</div>
                  </div>
                </aside>
              </div>
            ) : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
