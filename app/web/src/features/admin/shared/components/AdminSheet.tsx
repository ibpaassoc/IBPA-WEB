"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

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

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
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
          <div className="flex shrink-0 items-start justify-between gap-5 border-b border-[#D9E4F2] bg-white/90 px-7 py-5">
            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#8AA2BD]">
                  {eyebrow}
                </p>
              ) : null}

              {title ? (
                <DialogPrimitive.Title className="mt-1 truncate text-2xl font-semibold tracking-[-0.03em] text-[#10203B]">
                  {title}
                </DialogPrimitive.Title>
              ) : null}

              {description ? (
                <DialogPrimitive.Description className="mt-1 truncate text-sm text-[#6B7C93]">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {actions}

              <DialogPrimitive.Close
                aria-label="Close"
                className="flex size-10 items-center justify-center rounded-full border border-[#D9E4F2] bg-white text-[#6B7C93] shadow-sm transition-all hover:border-[#BDD0E8] hover:text-[#10203B]"
              >
                <X className="size-4" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <div
            className={cn(
              "grid min-h-0 flex-1",
              resolvedLeftRail && rightRail
                ? "lg:grid-cols-[520px_minmax(0,1fr)_320px]"
                : resolvedLeftRail
                  ? "lg:grid-cols-[520px_minmax(0,1fr)]"
                  : rightRail
                    ? "lg:grid-cols-[minmax(0,1fr)_320px]"
                    : "grid-cols-1",
            )}
          >
            {resolvedLeftRail ? (
              <aside className="no-scrollbar min-h-0 overflow-y-auto border-r border-[#D9E4F2] bg-white/60 p-5">
                <div className="admin-sheet-rail">{resolvedLeftRail}</div>
              </aside>
            ) : null}

            <main className="no-scrollbar min-h-0 overflow-y-auto px-6 py-6">
              <div className="admin-sheet-main">{children}</div>
            </main>

            {rightRail ? (
              <aside className="no-scrollbar min-h-0 overflow-y-auto border-l border-[#D9E4F2] bg-white/60 p-5">
                <div className="admin-sheet-rail">{rightRail}</div>
              </aside>
            ) : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}