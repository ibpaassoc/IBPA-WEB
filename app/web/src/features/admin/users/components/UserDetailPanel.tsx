"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminSectionCard } from "../../shared/components/AdminSectionCard";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { formatAdminDate, formatNullableText, initialsFromName } from "../../shared/utils/admin-formatters";
import type { AdminUserRecord } from "../types/user-admin.types";

type UserDetailPanelProps = {
  user: AdminUserRecord | null;
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

export function UserDetailPanel({ user }: UserDetailPanelProps) {
  if (!user) {
    return (
      <AdminSectionCard
        description="Open an account to review its membership, profile link, and dashboard access."
        title="User detail"
      >
        <AdminEmptyState
          description="Select a user from the list to view their account details."
          title="No user selected"
        />
      </AdminSectionCard>
    );
  }

  const previewHref = user.userId ? `/profile-preview/${user.userId}` : null;

  return (
    <AdminSectionCard title="User detail">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            <AvatarImage src={user.avatarUrl || undefined} />
            <AvatarFallback>{initialsFromName(user.userName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-foreground">{user.userName}</h3>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminStatusBadge tone="info">{user.cardName || user.membershipCategory || "Member"}</AdminStatusBadge>
          <AdminStatusBadge tone={user.accessTone}>{user.accessLabel}</AdminStatusBadge>
        </div>
      </div>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">Account</h3>
        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Phone" value={formatNullableText(user.phone)} />
          <InfoRow label="Member since" value={formatAdminDate(user.createdAt)} />
          <InfoRow label="Certificate" value={user.certificateNumber || "Not issued"} />
          <InfoRow label="Linked profile" value={user.userId ? "Yes" : "No"} />
        </dl>
      </section>

      <Separator />

      <div className="flex flex-wrap gap-2">
        {previewHref && user.hasDashboardAccess ? (
          <Button asChild type="button" variant="outline">
            <a href={previewHref} rel="noreferrer" target="_blank">
              <ExternalLink data-icon="inline-start" />
              View public profile
            </a>
          </Button>
        ) : null}
        <Button asChild type="button" variant="ghost">
          <Link href={`/admin/profiles?q=${encodeURIComponent(user.email)}`}>
            <ExternalLink data-icon="inline-start" />
            Manage in profiles
          </Link>
        </Button>
      </div>
    </AdminSectionCard>
  );
}
