"use client";

import { AlertCircle, Check, RefreshCw, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { initialsFromName } from "../../shared/utils/admin-formatters";
import { getAdminTeamMembers } from "../server/admin-team.repository";
import { isMailableTeamMember } from "../server/admin-team.service";
import type {
  AdminTeamMember,
  AdminTeamMembersResponse,
} from "../types/admin-team.types";

/**
 * Optional picker mode. Without it the list stays the read-only roster used by
 * the applications and members screens.
 */
export type AdminTeamSelection = {
  selectedEmails: string[];
  /** Seats already covered by a broader rule: shown checked and not clickable. */
  lockedEmails?: string[];
  onChange: (emails: string[], isSelected: boolean) => void;
};

type TeamMemberCardSelection = {
  isSelected: boolean;
  isLocked: boolean;
  onToggle: () => void;
};

type Props = {
  ownerOrderId: string;
  selection?: AdminTeamSelection;
};

function statusLabel(value: string) {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase()) || "Unknown";
}

function statusTone(value: string): "danger" | "info" | "neutral" | "success" | "warning" {
  switch (value.trim().toLowerCase()) {
    case "active":
    case "registered":
      return "success";
    case "removed":
      return "danger";
    case "inactive":
      return "warning";
    case "invited":
      return "info";
    default:
      return "neutral";
  }
}

export function TeamMemberCard({
  member,
  selection,
}: {
  member: AdminTeamMember;
  selection?: TeamMemberCardSelection;
}) {
  const isChecked = Boolean(selection && (selection.isSelected || selection.isLocked));

  return (
    <article
      className={cn(
        "relative grid min-h-28 gap-y-4 rounded-[22px] border bg-white px-4 py-5 shadow-[0_12px_30px_rgba(15,46,83,0.05)] sm:grid-cols-[minmax(13rem,1fr)_minmax(0,1.35fr)_7.5rem] sm:items-stretch sm:gap-x-5 sm:gap-y-0 sm:px-5 lg:grid-cols-[minmax(16rem,1fr)_minmax(0,1.45fr)_8.5rem] lg:gap-x-7 lg:px-6",
        isChecked ? "border-[#1F5D8F] bg-[#F4F9FF]" : "border-[#D7E5F4]",
      )}
    >
      {selection && !selection.isLocked ? (
        <button
          aria-label={`${selection.isSelected ? "Remove" : "Add"} ${member.email} as a recipient`}
          aria-pressed={selection.isSelected}
          className="absolute inset-0 rounded-[21px] transition-colors hover:bg-[#F8FBFF]/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#1F5D8F]/15"
          onClick={selection.onToggle}
          type="button"
        />
      ) : null}

      <div className="pointer-events-none relative z-[1] flex min-w-0 items-center gap-3.5">
        {selection ? (
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
              isChecked
                ? "border-transparent bg-[#1F5D8F] text-white"
                : "border-[#D7E5F4] bg-white text-transparent",
              selection.isLocked && "opacity-70",
            )}
          >
            <Check className="size-3.5" />
          </span>
        ) : null}

        <Avatar className="size-12 border border-[#C9DDF2] shadow-sm lg:size-14">
          <AvatarImage alt={member.fullName} src={member.avatarUrl || undefined} />
          <AvatarFallback className="bg-[#EEF6FF] text-sm font-semibold text-[#1F5D8F] lg:text-base">
            {initialsFromName(member.fullName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-5 text-[#10203B]">{member.fullName}</p>
          <p className="mt-0.5 break-all text-xs leading-5 text-[#6C7F95]">{member.email}</p>
          {member.credentials ? (
            <span className="mt-1.5 inline-flex max-w-full rounded-md border border-[#C7DDF5] bg-[#EEF6FF] px-2 py-1 font-mono text-[11px] font-semibold leading-none text-[#1F5D8F] shadow-sm">
              {member.credentials}
            </span>
          ) : (
            <span className="mt-1.5 inline-flex rounded-md border border-[#D7E5F4] bg-[#F6FAFF] px-2 py-1 text-[11px] font-medium leading-none text-[#6C7F95]">
              Not assigned
            </span>
          )}
        </div>
      </div>

      <dl className="contents text-xs">
        <div className="pointer-events-none relative z-[1] min-w-0 border-t border-[#E4EEF8] pt-4 sm:flex sm:flex-col sm:justify-center sm:border-0 sm:pt-0">
          <dt className="text-[#8AA2BD]">Role</dt>
          <dd className="mt-1 break-words text-sm font-medium leading-5 text-[#10203B]">
            {member.role || "Not provided"}
          </dd>
        </div>

        <div className="pointer-events-none relative z-[1] flex min-w-0 flex-col items-end justify-center border-t border-[#E4EEF8] pt-4 text-right sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0 lg:pl-7">
          <dt className="text-[#8AA2BD]">Access</dt>
          <dd className="mt-2">
            <AdminStatusBadge tone={statusTone(member.accessStatus)}>
              {statusLabel(member.accessStatus)}
            </AdminStatusBadge>
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function AdminTeamMemberList({ ownerOrderId, selection }: Props) {
  const [team, setTeam] = useState<AdminTeamMembersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    void getAdminTeamMembers(ownerOrderId, controller.signal)
      .then((response) => {
        setTeam(response);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;
        setTeam(null);
        setError(loadError instanceof Error ? loadError.message : "Could not load team members.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [ownerOrderId, retryCount]);

  const retry = () => {
    setIsLoading(true);
    setError(null);
    setRetryCount((value) => value + 1);
  };

  if (isLoading) {
    return (
      <div aria-label="Loading team members" className="space-y-3" role="status">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-32 w-full rounded-[22px] sm:h-28" />
        <Skeleton className="h-32 w-full rounded-[22px] sm:h-28" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[22px] border border-[#F2C7C7] bg-[#FFF8F8] px-5 py-8 text-center">
        <AlertCircle className="size-5 text-[#B42318]" />
        <div>
          <p className="text-sm font-semibold text-[#10203B]">Team members could not be loaded</p>
          <p className="mt-1 text-xs text-[#6C7F95]">{error}</p>
        </div>
        <Button onClick={retry} size="sm" type="button" variant="outline">
          <RefreshCw className="size-3.5" />
          Try again
        </Button>
      </div>
    );
  }

  const members = team?.items ?? [];
  const selectedEmails = new Set(selection?.selectedEmails ?? []);
  const lockedEmails = new Set(selection?.lockedEmails ?? []);
  const mailableEmails = members.filter(isMailableTeamMember).map((member) => member.email);
  const unlockedEmails = mailableEmails.filter((email) => !lockedEmails.has(email));
  const hasUnselected = unlockedEmails.some((email) => !selectedEmails.has(email));

  return (
    <section aria-label="Team members" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[#10203B]">Team members</h3>
          <p className="mt-0.5 text-xs text-[#6C7F95]">
            {!selection
              ? "Read-only account team visibility"
              : lockedEmails.size > 0
                ? "Already included with the account"
                : "Pick the seats that should receive this campaign"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selection && unlockedEmails.length > 0 ? (
            <button
              className="rounded-full border border-[#D7E5F4] bg-white px-3 py-1.5 text-xs font-medium text-[#1F5D8F] transition-colors hover:border-[#BFD3EA] hover:bg-[#EEF6FF]"
              onClick={() => selection.onChange(unlockedEmails, hasUnselected)}
              type="button"
            >
              {hasUnselected ? "Select all" : "Clear all"}
            </button>
          ) : null}
          <AdminStatusBadge tone="neutral">
            {team?.count ?? members.length} {team?.count === 1 ? "member" : "members"}
          </AdminStatusBadge>
        </div>
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed border-[#CFE0F3] bg-[#F8FBFF] px-5 py-9 text-center">
          <Users className="size-5 text-[#1F5D8F]" />
          <p className="text-sm font-semibold text-[#10203B]">No team members yet</p>
          <p className="text-xs text-[#6C7F95]">This account does not currently have team members.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {members.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              selection={
                selection && isMailableTeamMember(member)
                  ? {
                      isLocked: lockedEmails.has(member.email),
                      isSelected: selectedEmails.has(member.email),
                      onToggle: () =>
                        selection.onChange([member.email], !selectedEmails.has(member.email)),
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
