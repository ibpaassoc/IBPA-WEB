"use client";

import { AlertCircle, Check, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { getAdminTeamMembers } from "../../teams/server/admin-team.repository";
import { isMailableTeamMember } from "../../teams/server/admin-team.service";
import type { AdminTeamMember } from "../../teams/types/admin-team.types";

type MailingTeamPickerProps = {
  ownerOrderId: string;
  selectedEmails: string[];
  onChange: (emails: string[], isSelected: boolean) => void;
};

type MailingTeamSeatListProps = {
  members: AdminTeamMember[];
  selectedEmails: string[];
  onChange: (emails: string[], isSelected: boolean) => void;
};

function Initials({ name, email }: { name: string; email: string }) {
  const base = (name || email || "").trim();
  const parts = base.split(/[\s@]+/).filter(Boolean);
  const value = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : base.slice(0, 2);
  return (
    <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D7E5F4] bg-white text-[11px] font-semibold text-[#1F5D8F]">
      {value.toUpperCase() || "T"}
    </span>
  );
}

/**
 * Compact seat list shown inside a mailing recipient card. Deliberately not the
 * shared `AdminTeamMemberList`: that one is the full read-only roster used by
 * the applications and members screens, while this matches the member cards it
 * is nested in.
 */
export function MailingTeamSeatList({
  members,
  onChange,
  selectedEmails,
}: MailingTeamSeatListProps) {
  if (members.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-[#CFE0F3] bg-white px-3 py-3 text-center text-xs text-[#6C7F95]">
        No team members yet.
      </p>
    );
  }

  const selectedSet = new Set(selectedEmails);
  const mailableEmails = members.filter(isMailableTeamMember).map((member) => member.email);
  const hasUnselected = mailableEmails.some((email) => !selectedSet.has(email));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8AA2BD]">
          {members.length} team member{members.length === 1 ? "" : "s"}
        </p>
        {mailableEmails.length > 0 ? (
          <button
            className="rounded-full border border-[#D7E5F4] bg-white px-2.5 py-1 text-[11px] font-medium text-[#1F5D8F] transition-colors hover:border-[#BFD3EA] hover:bg-[#EEF6FF]"
            onClick={() => onChange(mailableEmails, hasUnselected)}
            type="button"
          >
            {hasUnselected ? "Select all" : "Clear all"}
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        {members.map((member) => {
          const isSelectable = isMailableTeamMember(member);
          const isSelected = selectedSet.has(member.email);

          return (
            <div
              className={cn(
                "relative flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition-colors duration-200",
                isSelected ? "border-[#1F5D8F] bg-[#F4F9FF]" : "border-[#D7E5F4] bg-white",
                !isSelectable && "opacity-60",
              )}
              key={member.id}
            >
              {isSelectable ? (
                <button
                  aria-label={`${isSelected ? "Remove" : "Add"} ${member.email} as a recipient`}
                  aria-pressed={isSelected}
                  className={cn(
                    "absolute inset-0 rounded-[11px] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#1F5D8F]/15",
                    !isSelected && "hover:bg-[#F8FBFF]",
                  )}
                  onClick={() => onChange([member.email], !isSelected)}
                  type="button"
                />
              ) : null}

              <div className="pointer-events-none relative z-[1]">
                <Initials email={member.email} name={member.fullName} />
              </div>

              <div className="pointer-events-none relative z-[1] flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13px] font-semibold leading-tight text-[#10203B]">
                  {member.fullName || member.email}
                </span>
                <span className="truncate text-[11px] leading-tight text-[#6C7F95]">
                  {member.email}
                  {member.role ? ` · ${member.role}` : ""}
                </span>
              </div>

              {isSelectable ? (
                <span
                  className={cn(
                    "pointer-events-none relative z-[1] flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
                    isSelected
                      ? "border-transparent bg-[#1F5D8F] text-white"
                      : "border-[#D7E5F4] bg-white text-transparent",
                  )}
                >
                  <Check className="size-3" />
                </span>
              ) : (
                <span className="relative z-[1] shrink-0 rounded-full border border-[#D7E5F4] bg-[#F6FAFF] px-2 py-0.5 text-[10px] font-medium text-[#6C7F95]">
                  Removed
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MailingTeamPicker({
  onChange,
  ownerOrderId,
  selectedEmails,
}: MailingTeamPickerProps) {
  const [members, setMembers] = useState<AdminTeamMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void getAdminTeamMembers(ownerOrderId, controller.signal)
      .then((response) => {
        setMembers(response.items ?? []);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;
        setMembers([]);
        setError(loadError instanceof Error ? loadError.message : "Could not load team members.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [ownerOrderId, retryCount]);

  if (isLoading) {
    return (
      <div aria-label="Loading team members" className="flex flex-col gap-1.5" role="status">
        <Skeleton className="h-[52px] rounded-xl bg-white" />
        <Skeleton className="h-[52px] rounded-xl bg-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[#F2C7C7] bg-[#FFF8F8] px-3 py-2.5 text-xs text-[#8A3B36]">
        <AlertCircle className="size-3.5 shrink-0 text-[#B42318]" />
        <span className="min-w-0 flex-1 truncate">{error}</span>
        <button
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#E7C4C4] bg-white px-2 py-1 font-medium text-[#B42318] transition-colors hover:bg-[#FFF1F1]"
          onClick={() => {
            setIsLoading(true);
            setError(null);
            setRetryCount((value) => value + 1);
          }}
          type="button"
        >
          <RefreshCw className="size-3" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <MailingTeamSeatList
      members={members}
      onChange={onChange}
      selectedEmails={selectedEmails}
    />
  );
}
