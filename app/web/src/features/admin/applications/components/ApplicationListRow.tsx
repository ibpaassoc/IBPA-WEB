"use client";

import { ArrowRight, Mail } from "lucide-react";

import { cn } from "@/lib/utils";

import { formatAdminDate } from "../../shared/utils/admin-formatters";
import type { AdminApplicationRecord } from "../types/application-admin.types";
import { ApplicationCombinedStatus } from "./ApplicationCombinedStatus";

type ApplicationListRowProps = {
  record: AdminApplicationRecord;
  isActive?: boolean;
  onOpen: (record: AdminApplicationRecord) => void;
};

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const value =
    parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : name.slice(0, 2);

  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#D7E5F4] bg-[#EEF6FF] text-sm font-semibold text-[#1F5D8F]">
      {value.toUpperCase()}
    </span>
  );
}

export function ApplicationListRow({
  record,
  isActive,
  onOpen,
}: ApplicationListRowProps) {
  return (
    <button
      className={cn(
        "group flex w-full min-w-0 items-center gap-4 rounded-[24px] border bg-white px-4 py-3.5 text-left shadow-[0_18px_45px_rgba(15,46,83,0.06)] transition-all duration-200",
        "hover:border-[#BFD3EA] hover:bg-[#F8FBFF]",
        isActive
          ? "border-[#1F5D8F] ring-4 ring-[#1F5D8F]/10"
          : "border-[#D7E5F4]",
      )}
      onClick={() => onOpen(record)}
      type="button"
    >
      <Initials name={record.applicantName} />

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-semibold text-[#10203B]">
            {record.applicantName}
          </p>
          <span className="hidden shrink-0 rounded-full border border-[#D7E5F4] bg-[#F6FAFF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#55708D] sm:inline">
            {record.kind === "member" ? record.applicantType : "Partner"}
          </span>
        </div>

        <p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-xs text-[#6C7F95]">
          <Mail className="size-3 shrink-0 text-[#8AA2BD]" />
          <span className="truncate">{record.applicantEmail}</span>
        </p>
      </div>

      <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
        <ApplicationCombinedStatus record={record} />
        <span className="text-[11px] tabular-nums text-[#8AA2BD]">
          {formatAdminDate(record.submittedAt)}
        </span>
      </div>

      <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl border border-[#D7E5F4] bg-white text-[#55708D] transition-all duration-200 group-hover:translate-x-0.5 group-hover:border-[#BFD3EA] group-hover:text-[#1F5D8F]">
        <ArrowRight className="size-4" />
      </span>
    </button>
  );
}
