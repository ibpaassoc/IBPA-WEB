"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { membershipConfigs } from "@/lib/membership";

import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { formatAdminDate } from "../../shared/utils/admin-formatters";
import type { AdminMemberRecord } from "../types/members-admin.types";

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

type Props = {
  member: AdminMemberRecord;
  selectedCategory: string;
  busyAction: string | null;
  onCategoryChange: (value: string) => void;
  onSaveCategory: () => void;
  onDeleteMembership: () => void;
};

export function MemberMembershipTab({
  busyAction,
  member,
  onCategoryChange,
  onDeleteMembership,
  onSaveCategory,
  selectedCategory,
}: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      {/* Left: read-only info */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap gap-2">
          <AdminStatusBadge tone="info">
            {member.cardName || member.membershipCategory || "Uncategorized"}
          </AdminStatusBadge>
          <AdminStatusBadge tone={member.expiryTone}>{member.expiryLabel}</AdminStatusBadge>
          <AdminStatusBadge tone={member.isLinked ? "success" : "neutral"}>
            {member.isLinked ? "Dashboard linked" : "Not linked"}
          </AdminStatusBadge>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Member since" value={formatAdminDate(member.createdAt)} />
          <InfoRow label="Expires" value={formatAdminDate(member.expiresAt)} />
          <InfoRow label="Certificate" value={member.certificateNumber || "Not issued"} />
          <InfoRow
            label="Dashboard access"
            value={member.hasDashboardAccess ? "Enabled" : "Not linked"}
          />
        </dl>
      </div>

      {/* Right: action rail */}
      <aside className="flex flex-col gap-3">
        <section className="rounded-[22px] border border-[#D7E5F4] bg-[#F8FBFF] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
            Membership actions
          </p>
          <FieldGroup className="mt-3">
            <Field>
              <FieldLabel className="text-xs font-medium text-[#55708D]">
                Membership package
              </FieldLabel>
              <Select onValueChange={onCategoryChange} value={selectedCategory || undefined}>
                <SelectTrigger className="h-10 w-full rounded-2xl border-[#D7E5F4] bg-white text-[#10203B]">
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {membershipConfigs.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <Button
            className="mt-3 h-10 w-full rounded-2xl bg-[#1F5D8F] text-white hover:bg-[#10203B]"
            disabled={busyAction === "membership"}
            onClick={onSaveCategory}
            type="button"
          >
            {busyAction === "membership" ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : null}
            Save category
          </Button>
        </section>

        <section className="rounded-[22px] border border-[#F2C7C7] bg-[#FFF5F5] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#B42318]">
            Danger zone
          </p>
          <Button
            className="mt-3 h-10 w-full rounded-2xl"
            disabled={busyAction === "delete_membership"}
            onClick={onDeleteMembership}
            type="button"
            variant="destructive"
          >
            {busyAction === "delete_membership" ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : null}
            Delete membership
          </Button>
        </section>
      </aside>
    </div>
  );
}
