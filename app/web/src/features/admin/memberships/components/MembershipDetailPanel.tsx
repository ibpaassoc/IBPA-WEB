"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { formatAdminDate, initialsFromName } from "../../shared/utils/admin-formatters";
import type { AdminMembershipRecord } from "../types/membership-admin.types";

type MembershipDetailPanelProps = {
  isLoading: boolean;
  membership: AdminMembershipRecord | null;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#DCE7F5] bg-[#F8FBFF] p-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6C7F95]">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm font-medium text-[#10203B]">{value}</dd>
    </div>
  );
}

export function MembershipDetailPanel({ isLoading, membership }: MembershipDetailPanelProps) {
  if (!membership) {
    return (
      <AdminSectionCard
        description="Open a membership record to review its category, status, and expiry timeline."
        title="Membership detail"
      >
        <AdminEmptyState
          description="Select a member from the list to view their membership lifecycle."
          title="No membership selected"
        />
      </AdminSectionCard>
    );
  }

  if (isLoading) {
    return (
      <AdminSectionCard title="Loading membership">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </AdminSectionCard>
    );
  }

  return (
    <AdminSectionCard title="Membership detail">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarImage src={membership.avatarUrl || undefined} />
            <AvatarFallback>{initialsFromName(membership.userName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-foreground">{membership.userName}</h3>
            <p className="truncate text-sm text-muted-foreground">{membership.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminStatusBadge tone="info">{membership.cardName || membership.membershipCategory || "Member"}</AdminStatusBadge>
          <AdminStatusBadge tone="success">{membership.status || "Active"}</AdminStatusBadge>
          <AdminStatusBadge tone={membership.expiryTone}>{membership.expiryLabel}</AdminStatusBadge>
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Lifecycle</h3>
        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Member since" value={formatAdminDate(membership.createdAt)} />
          <InfoRow label="Renews / expires" value={formatAdminDate(membership.expiresAt)} />
          <InfoRow label="Certificate" value={membership.certificateNumber || "Not issued"} />
          <InfoRow label="Dashboard access" value={membership.hasDashboardAccess ? "Enabled" : "Not linked"} />
        </dl>
      </section>

      <Separator />

      <p className="text-sm leading-6 text-muted-foreground">
        Membership and certificate actions are managed from the member&apos;s profile to keep a single source of truth.
      </p>

      <Button asChild type="button" variant="outline">
        <Link href={`/admin/profiles?q=${encodeURIComponent(membership.email)}`}>
          <ExternalLink data-icon="inline-start" />
          Open in profiles
        </Link>
      </Button>
    </AdminSectionCard>
  );
}
