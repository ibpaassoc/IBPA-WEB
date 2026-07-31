"use client";

import { AlertCircle, RefreshCw, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { initialsFromName } from "../../shared/utils/admin-formatters";
import { getAdminTeamMembers } from "../server/admin-team.repository";
import type {
  AdminTeamMember,
  AdminTeamMembersResponse,
} from "../types/admin-team.types";

type Props = {
  ownerOrderId: string;
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

function TeamMemberCard({ member }: { member: AdminTeamMember }) {
  return (
    <article className="grid gap-4 rounded-[22px] border border-[#D7E5F4] bg-white p-4 shadow-[0_12px_30px_rgba(15,46,83,0.05)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="flex min-w-0 items-start gap-3">
        <Avatar className="size-11 border border-[#D6E3F2] shadow-sm">
          <AvatarImage alt={member.fullName} src={member.avatarUrl || undefined} />
          <AvatarFallback className="bg-[#EEF6FF] font-semibold text-[#1F5D8F]">
            {initialsFromName(member.fullName)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-[#10203B]">{member.fullName}</p>
            <AdminStatusBadge tone={statusTone(member.status)}>
              {statusLabel(member.status)}
            </AdminStatusBadge>
          </div>
          <p className="mt-1 break-all text-xs text-[#6C7F95]">{member.email}</p>
          <p className="mt-1 font-mono text-[11px] text-[#8AA2BD]">{member.teamMemberId}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-5 gap-y-2 text-xs sm:min-w-[290px]">
        <div>
          <dt className="text-[#8AA2BD]">Role</dt>
          <dd className="mt-0.5 font-medium text-[#10203B]">{member.role || "Not provided"}</dd>
        </div>
        <div>
          <dt className="text-[#8AA2BD]">Seat type</dt>
          <dd className="mt-0.5 font-medium text-[#10203B]">{statusLabel(member.seatType)}</dd>
        </div>
        <div>
          <dt className="text-[#8AA2BD]">Access</dt>
          <dd className="mt-1">
            <AdminStatusBadge tone={statusTone(member.accessStatus)}>
              {statusLabel(member.accessStatus)}
            </AdminStatusBadge>
          </dd>
        </div>
        <div>
          <dt className="text-[#8AA2BD]">Registration</dt>
          <dd className="mt-1">
            <AdminStatusBadge tone={statusTone(member.registrationStatus)}>
              {statusLabel(member.registrationStatus)}
            </AdminStatusBadge>
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function AdminTeamMemberList({ ownerOrderId }: Props) {
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
        <Skeleton className="h-28 w-full rounded-[22px]" />
        <Skeleton className="h-28 w-full rounded-[22px]" />
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

  return (
    <section aria-label="Team members" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[#10203B]">Team members</h3>
          <p className="mt-0.5 text-xs text-[#6C7F95]">Read-only account team visibility</p>
        </div>
        <AdminStatusBadge tone="neutral">
          {team?.count ?? members.length} {team?.count === 1 ? "member" : "members"}
        </AdminStatusBadge>
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
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </section>
  );
}
