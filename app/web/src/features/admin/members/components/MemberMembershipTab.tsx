"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { membershipConfigs } from "@/lib/membership";

import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { formatAdminDate } from "../../shared/utils/admin-formatters";
import type { AdminMemberRecord } from "../types/members-admin.types";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-3">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
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
    <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
      {/* Info */}
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
          <InfoRow
            label="Certificate"
            value={member.certificateNumber || "Not issued"}
          />
          <InfoRow
            label="Dashboard access"
            value={member.hasDashboardAccess ? "Enabled" : "Not linked"}
          />
        </dl>

        <Separator />

        <section className="flex flex-col gap-3">
          <h4 className="text-sm font-medium text-foreground">Change membership category</h4>
          <FieldGroup>
            <Field>
              <FieldLabel>Membership package</FieldLabel>
              <Select
                onValueChange={onCategoryChange}
                value={selectedCategory || undefined}
              >
                <SelectTrigger className="w-full">
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
            disabled={busyAction === "membership"}
            onClick={onSaveCategory}
            size="sm"
            type="button"
            variant="outline"
          >
            {busyAction === "membership" ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : null}
            Save category
          </Button>
        </section>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <p className="text-xs font-semibold text-muted-foreground">Membership actions</p>
        <Button
          disabled={busyAction === "delete_membership"}
          onClick={onDeleteMembership}
          size="sm"
          type="button"
          variant="outline"
        >
          {busyAction === "delete_membership" ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : null}
          Delete membership
        </Button>
      </div>
    </div>
  );
}
