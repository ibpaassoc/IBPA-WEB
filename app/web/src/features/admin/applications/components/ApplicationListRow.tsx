"use client";

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
  const value =
    parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : name.slice(0, 2);

  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#D9E4F2] bg-[#F7FAFE] text-sm font-semibold text-[#21466D]">
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
        "group flex w-full min-w-0 items-center gap-4 rounded-[24px] border bg-white/78 px-4 py-3.5 text-left shadow-sm backdrop-blur-2xl",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-[#BDD0E8] hover:bg-white hover:shadow-[0_18px_44px_rgba(15,35,70,0.10)]",
        isActive
          ? "border-[#21466D] ring-4 ring-[#21466D]/10"
          : "border-[#D9E4F2]",
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
          <span className="hidden shrink-0 rounded-full border border-[#D9E4F2] bg-[#F7FAFE] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7A94B2] sm:inline">
            {record.kind === "member" ? record.applicantType : "Partner"}
          </span>
        </div>

        <p className="mt-1 flex min-w-0 items-center gap-1.5 truncate text-xs text-[#6B7C93]">
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

      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-[#D9E4F2] bg-white text-[#7A94B2] transition-all duration-300 group-hover:translate-x-0.5 group-hover:border-[#BDD0E8] group-hover:text-[#21466D]">
        <ArrowRight className="size-4" />
      </span>
    </button>
  );
}
