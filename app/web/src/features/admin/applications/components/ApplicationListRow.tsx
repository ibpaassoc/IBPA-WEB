"use client";

import { motion } from "motion/react";
import { ArrowRight, Mail } from "lucide-react";

import { cn } from "@/lib/utils";

import { formatAdminDate } from "../../shared/utils/admin-formatters";
import type { AdminApplicationRecord } from "../types/application-admin.types";
import { ApplicationCombinedStatus } from "./ApplicationCombinedStatus";

type ApplicationListRowProps = {
  record: AdminApplicationRecord;
  isActive?: boolean;
  index: number;
  onOpen: (record: AdminApplicationRecord) => void;
};

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const value = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : name.slice(0, 2);
  return (
    <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--hairline)] bg-[var(--vellum)] text-[13px] font-medium tracking-tight text-foreground">
      <span
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(120% 70% at 0% 0%, rgba(185,122,62,0.18), transparent 60%)",
        }}
      />
      <span className="relative">{value.toUpperCase()}</span>
    </span>
  );
}

export function ApplicationListRow({
  record,
  isActive,
  index,
  onOpen,
}: ApplicationListRowProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onOpen(record)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(0.025 + index * 0.025, 0.4), duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative flex w-full items-center gap-4 rounded-2xl border bg-[var(--card)] px-5 py-4 text-left",
        "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:-translate-y-px hover:border-[var(--hairline-strong)] hover:shadow-[var(--shadow-soft)]",
        isActive
          ? "border-[var(--accent-copper)] shadow-[var(--shadow-soft)]"
          : "border-[var(--hairline)]",
      )}
    >
      <Initials name={record.applicantName} />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-serif text-base font-medium text-foreground">
            {record.applicantName}
          </span>
          <span
            className="hidden rounded-full border border-[var(--hairline)] px-2 py-px text-[10px] font-medium uppercase tracking-tight text-muted-foreground sm:inline"
          >
            {record.kind === "member" ? record.applicantType : "Partner"}
          </span>
        </div>
        <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <Mail className="size-3 shrink-0" />
          {record.applicantEmail}
        </span>
      </div>

      <div className="hidden flex-col items-end gap-1 sm:flex">
        <ApplicationCombinedStatus record={record} />
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {formatAdminDate(record.submittedAt)}
        </span>
      </div>

      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--hairline)] bg-white text-muted-foreground",
          "transition-all duration-300 group-hover:translate-x-0.5 group-hover:border-[var(--accent-copper)] group-hover:text-foreground",
        )}
      >
        <ArrowRight className="size-3.5" />
      </span>
    </motion.button>
  );
}
