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
  children: ReactNode;
  className?: string;
  size?: "md" | "lg" | "xl";
};

const sizeMap = {
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

/**
 * Right-side sliding sheet used for record details / forms.
 * Premium glass scrim + paper sheet, motion respects reduced-motion.
 */
export function AdminSheet({
  open,
  onOpenChange,
  title,
  eyebrow,
  description,
  actions,
  children,
  className,
  size = "lg",
}: AdminSheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-[rgba(20,14,8,0.45)] backdrop-blur-[6px]",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=open]:duration-300 data-[state=closed]:duration-200",
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed right-0 top-0 z-50 flex h-dvh w-full flex-col bg-[var(--vellum)]",
            "border-l border-[var(--hairline-strong)] shadow-[var(--shadow-deep)]",
            "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-right",
            "data-[state=open]:duration-400 data-[state=closed]:duration-250",
            sizeMap[size],
            className,
          )}
        >
          {/* Sticky header */}
          <div className="glass sticky top-0 z-10 flex shrink-0 items-start justify-between gap-4 border-x-0 border-t-0 border-b border-[var(--hairline)] px-8 py-5">
            <div className="flex min-w-0 flex-col gap-1">
              {eyebrow ? (
                <span className="editorial-eyebrow text-xs">{eyebrow}</span>
              ) : null}
              {title ? (
                <DialogPrimitive.Title className="font-serif text-2xl font-medium tracking-tight text-foreground">
                  {title}
                </DialogPrimitive.Title>
              ) : null}
              {description ? (
                <DialogPrimitive.Description className="max-w-prose text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {actions}
              <DialogPrimitive.Close
                className={cn(
                  "flex size-9 items-center justify-center rounded-full border border-[var(--hairline)] bg-white/70",
                  "text-muted-foreground transition-all hover:rotate-90 hover:border-[var(--hairline-strong)] hover:text-foreground",
                )}
                aria-label="Close"
              >
                <X className="size-4" />
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-8 py-8">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
