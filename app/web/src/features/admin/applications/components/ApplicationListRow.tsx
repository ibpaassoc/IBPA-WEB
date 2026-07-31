"use client";

import { ArrowRight, ChevronDown, Mail, Users } from "lucide-react";

import { cn } from "@/lib/utils";

import { formatAdminDate } from "../../shared/utils/admin-formatters";
import type { AdminApplicationRecord } from "../types/application-admin.types";
import { handleTeamControlClick } from "../server/application-admin.service";
import { ApplicationCombinedStatus } from "./ApplicationCombinedStatus";
import { AdminTeamMemberList } from "../../teams/components/AdminTeamMemberList";

type ApplicationListRowProps = {
  record: AdminApplicationRecord;
  isActive?: boolean;
  hasTeam?: boolean;
  isTeamOpen?: boolean;
  onOpen: (record: AdminApplicationRecord) => void;
  onToggleTeam?: (record: AdminApplicationRecord) => void;
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
  hasTeam = false,
  isTeamOpen = false,
  onOpen,
  onToggleTeam,
}: ApplicationListRowProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-[24px] border bg-white shadow-[0_18px_45px_rgba(15,46,83,0.06)] transition-all duration-200",
        isActive
          ? "border-[#1F5D8F] ring-4 ring-[#1F5D8F]/10"
          : "border-[#D7E5F4]",
      )}
    >
      <div className="relative flex min-w-0 items-center gap-3 px-4 py-3.5 sm:gap-4">
        <button
          aria-label={`Review ${record.applicantName}'s application`}
          className="peer absolute inset-0 rounded-[23px] text-left transition-colors hover:bg-[#F8FBFF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#1F5D8F]/15"
          onClick={() => onOpen(record)}
          type="button"
        />

        <div className="pointer-events-none relative z-[1]">
          <Initials name={record.applicantName} />
        </div>

        <div className="pointer-events-none relative z-[1] min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="pointer-events-none min-w-0 truncate text-sm font-semibold text-[#10203B]">
              {record.applicantName}
            </p>
            <span className="pointer-events-none hidden shrink-0 rounded-full border border-[#D7E5F4] bg-[#F6FAFF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#55708D] sm:inline">
              {record.kind === "member" ? record.applicantType : "Partner"}
            </span>

            {hasTeam ? (
              <button
                aria-expanded={isTeamOpen}
                className={cn(
                  "pointer-events-auto relative z-10 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold shadow-sm transition-colors",
                  isTeamOpen
                    ? "border-[#B9D4F0] bg-[#EEF6FF] text-[#1F5D8F]"
                    : "border-[#D7E5F4] bg-white text-[#55708D] hover:bg-[#F6FAFF]",
                )}
                onClick={(event) => handleTeamControlClick(event, record, onToggleTeam)}
                type="button"
              >
                <Users className="size-3.5" />
                Team
                <ChevronDown className={cn("size-3 transition-transform", isTeamOpen && "rotate-180")} />
              </button>
            ) : null}
          </div>

          <p className="pointer-events-none mt-1 flex min-w-0 items-center gap-1.5 truncate text-xs text-[#6C7F95]">
            <Mail className="size-3 shrink-0 text-[#8AA2BD]" />
            <span className="truncate">{record.applicantEmail}</span>
          </p>
        </div>

        <div className="pointer-events-none relative z-[1] hidden shrink-0 flex-col items-end gap-1 sm:flex">
          <ApplicationCombinedStatus record={record} />
          <span className="text-[11px] tabular-nums text-[#8AA2BD]">
            {formatAdminDate(record.submittedAt)}
          </span>
        </div>

        <span className="pointer-events-none relative z-[1] flex size-9 shrink-0 items-center justify-center rounded-2xl border border-[#D7E5F4] bg-white text-[#55708D] transition-all duration-200 peer-hover:translate-x-0.5 peer-hover:border-[#BFD3EA] peer-hover:text-[#1F5D8F]">
          <ArrowRight className="size-4" />
        </span>
      </div>

      {hasTeam && isTeamOpen ? (
        <div
          className="border-t border-[#D7E5F4] bg-[#F6FAFF] p-4 sm:p-5"
          onClick={(event) => event.stopPropagation()}
        >
          <AdminTeamMemberList ownerOrderId={record.id} />
        </div>
      ) : null}
    </article>
  );
}
