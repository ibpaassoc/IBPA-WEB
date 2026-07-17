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
import { applicationSectionTitles } from "@/lib/application-fields";
import { membershipConfigs } from "@/lib/membership";

import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { buildMemberApplicationSections } from "../server/application-admin.service";
import type {
  AdminApplicationRecord,
  ApplicationFieldSection,
  MemberApplicationDetail,
  PartnerApplicationDetail,
} from "../types/application-admin.types";
import { ApplicationReviewActions } from "./ApplicationReviewActions";

type ApplicationReviewRailProps = {
  record?: AdminApplicationRecord | null;
  memberApplication?: MemberApplicationDetail | null;
  partnerApplication?: PartnerApplicationDetail | null;
  busyAction: string | null;
  selectedMembershipCategory: string;
  selectedPartnerTier: string;
  onApprove: () => void;
  onDelete: () => void;
  onReject: () => void;
  onResendPaymentLink: () => void;
  onReview: (requestedChanges: string) => Promise<boolean>;
  onMembershipCategoryChange: (value: string) => void;
  onPartnerTierChange: (value: string) => void;
  onSaveMembershipCategory: () => void;
};

function RailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-[#D7E5F4] bg-white p-5 shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
      <h3 className="mb-4 text-sm font-semibold tracking-[-0.01em] text-[#10203B]">{title}</h3>
      {children}
    </section>
  );
}

function SummaryFields({ sections }: { sections: ApplicationFieldSection[] }) {
  if (!sections.length) return null;

  return (
    <div className="grid gap-2">
      {sections.flatMap((section) =>
        section.items.map((item) => (
          <div
            className="rounded-[18px] border border-[#DCE7F5] bg-[#F8FBFF] px-4 py-3"
            key={`${section.title}-${item.label}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6C7F95]">
              {item.label}
            </p>
            <p className="mt-1.5 break-words text-sm leading-5 text-[#10203B]">
              {String(item.value ?? "").trim() || "Not provided"}
            </p>
          </div>
        )),
      )}
    </div>
  );
}

export function ApplicationReviewRail({
  busyAction,
  memberApplication,
  onApprove,
  onDelete,
  onMembershipCategoryChange,
  onPartnerTierChange,
  onReject,
  onResendPaymentLink,
  onReview,
  onSaveMembershipCategory,
  partnerApplication,
  record,
  selectedMembershipCategory,
  selectedPartnerTier,
}: ApplicationReviewRailProps) {
  if (!record) return null;

  const memberSections = memberApplication
    ? buildMemberApplicationSections(memberApplication)
    : [];

  const membershipSections = memberSections.filter(
    (section) => section.title === applicationSectionTitles.summary,
  );

  return (
    <div className="space-y-5">
      {record.kind === "member" && memberApplication ? (
        <RailCard title="Membership">
          <div className="space-y-4">
            <SummaryFields sections={membershipSections} />

            <FieldGroup>
              <Field>
                <FieldLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6C7F95]">
                  Membership package
                </FieldLabel>
                <Select
                  onValueChange={onMembershipCategoryChange}
                  value={selectedMembershipCategory || undefined}
                >
                  <SelectTrigger className="h-11 rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B]">
                    <SelectValue placeholder="Select membership package" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {membershipConfigs.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </FieldGroup>

            <Button
              className="h-11 w-full rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
              disabled={busyAction === "membership"}
              onClick={onSaveMembershipCategory}
              type="button"
              variant="outline"
            >
              {busyAction === "membership" ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : null}
              Save membership package
            </Button>

            {memberApplication.certificateNumber ? (
              <AdminStatusBadge tone="success">
                Certificate {memberApplication.certificateNumber}
              </AdminStatusBadge>
            ) : null}
          </div>
        </RailCard>
      ) : null}

      {record.kind === "partner" && partnerApplication ? (
        <RailCard title="Partner tier">
          <FieldGroup>
            <Field>
              <FieldLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6C7F95]">
                Partner tier
              </FieldLabel>
              <Select
                onValueChange={onPartnerTierChange}
                value={selectedPartnerTier}
              >
                <SelectTrigger className="h-11 rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B]">
                  <SelectValue placeholder="Select partner tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {["Associate", "Community", "Premier"].map((tier) => (
                      <SelectItem key={tier} value={tier}>
                        {tier}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </RailCard>
      ) : null}

      <RailCard title="Review actions">
        <ApplicationReviewActions
          busyAction={busyAction}
          memberApplication={memberApplication}
          onApprove={onApprove}
          onDelete={onDelete}
          onReject={onReject}
          onResendPaymentLink={onResendPaymentLink}
          onReview={onReview}
          partnerApplication={partnerApplication}
          record={record}
        />
      </RailCard>
    </div>
  );
}
