"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { MailingAudienceKind, MailingDraft } from "../types/mailing.types";

type MailingAudienceSelectorProps = {
  categories: string[];
  draft: MailingDraft;
  membershipTypes: string[];
  onChange: (draft: MailingDraft) => void;
  recipientCount: number;
};

export function MailingAudienceSelector({
  categories,
  draft,
  membershipTypes,
  onChange,
  recipientCount,
}: MailingAudienceSelectorProps) {
  const patch = (next: Partial<MailingDraft>) => onChange({ ...draft, ...next });
  const options = draft.audienceKind === "membership_type" ? membershipTypes : categories;
  const isFutureAudience = draft.audienceKind === "team_members";

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          onValueChange={(value) =>
            patch({ audienceKind: value as MailingAudienceKind, audienceValue: "" })
          }
          value={draft.audienceKind}
        >
          <SelectTrigger className="h-10 rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B]">
            <SelectValue placeholder="Audience" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all_users">All users</SelectItem>
              <SelectItem value="members">Members</SelectItem>
              <SelectItem value="partners">Partners</SelectItem>
              <SelectItem value="team_members">Team members</SelectItem>
              <SelectItem value="event_registrants">Event registrants</SelectItem>
              <SelectItem value="application_pending">Application: pending</SelectItem>
              <SelectItem value="application_approved">Application: approved</SelectItem>
              <SelectItem value="application_rejected">Application: rejected</SelectItem>
              <SelectItem value="membership_category">Membership category</SelectItem>
              <SelectItem value="membership_type">Membership type</SelectItem>
              <SelectItem value="custom">Custom email list</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {draft.audienceKind === "membership_category" || draft.audienceKind === "membership_type" ? (
          <Select
            onValueChange={(value) => patch({ audienceValue: value })}
            value={draft.audienceValue}
          >
            <SelectTrigger className="h-10 rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-[#10203B]">
              <SelectValue placeholder="Choose membership" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {options.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        ) : null}
      </div>

      {draft.audienceKind === "custom" ? (
        <Textarea
          className="rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] text-sm text-[#10203B]"
          onChange={(event) => patch({ customEmails: event.target.value })}
          placeholder="Paste emails separated by commas, spaces, or new lines"
          rows={5}
          value={draft.customEmails}
        />
      ) : null}

      <p className="text-sm text-[#6C7F95]">
        Current audience resolves to{" "}
        <span className="font-semibold tabular-nums text-[#10203B]">{recipientCount}</span>{" "}
        recipient{recipientCount === 1 ? "" : "s"}.
      </p>
      {isFutureAudience ? (
        <p className="rounded-2xl border border-[#D7E5F4] bg-[#F8FBFF] px-4 py-3 text-sm text-[#55708D]">
          Team-member targeting is ready in the UI but needs a dedicated admin audience resolver
          before sending.
        </p>
      ) : null}
    </div>
  );
}
