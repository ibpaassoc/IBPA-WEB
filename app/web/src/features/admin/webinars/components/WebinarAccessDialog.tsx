"use client";

import { Check, LoaderCircle, Lock, Send, Users } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WebinarAccessInput } from "../server/webinar.repository";
import type {
  MembershipCategory,
  WebinarAccessSettings,
  WebinarAudience,
  WebinarSubtitleState,
} from "../types/webinar.types";
import {
  findVersion,
  languageName,
  versionName,
} from "../utils/subtitle-versions";
import {
  individualCategories,
  type MembershipCategoryOption,
} from "../utils/webinar-access";

type WebinarAccessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "publish" | "edit";
  access: WebinarAccessSettings;
  membershipCategories: MembershipCategoryOption[];
  subtitles: WebinarSubtitleState;
  isSaving: boolean;
  onSubmit: (access: WebinarAccessInput) => void;
};

export function WebinarAccessDialog(props: WebinarAccessDialogProps) {
  return (
    <Dialog onOpenChange={props.onOpenChange} open={props.open}>
      <DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl gap-0 overflow-hidden rounded-[28px] border border-[#D4E0F0] p-0">
        {/* Remount per opening so the form starts from the saved settings. */}
        {props.open ? <AccessForm {...props} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function AccessForm({
  access,
  isSaving,
  membershipCategories,
  mode,
  onOpenChange,
  onSubmit,
  subtitles,
}: WebinarAccessDialogProps) {
  const [audience, setAudience] = useState<WebinarAudience>(access.audience);
  const [membershipTypes, setMembershipTypes] = useState<MembershipCategory[]>(
    access.membershipTypes,
  );
  const [allowTeamMembers, setAllowTeamMembers] = useState(
    access.allowTeamMembers,
  );
  const [showErrors, setShowErrors] = useState(false);
  const individuals = individualCategories(membershipCategories);
  const typesMissing =
    audience === "MEMBERSHIP_TYPES" && !membershipTypes.length;

  const audiences: Array<{
    value: WebinarAudience;
    title: string;
    description: string;
  }> = [
    {
      value: "ALL_MEMBERS",
      title: "All members",
      description: "Every signed-in member with an active membership.",
    },
    {
      value: "INDIVIDUALS",
      title: "Individuals only",
      description: individuals.length
        ? `Individual member accounts: ${individuals.join(", ")}.`
        : "Individual member accounts only.",
    },
    {
      value: "MEMBERSHIP_TYPES",
      title: "Specific membership types",
      description: "Choose one or more existing IBPA membership categories.",
    },
  ];

  const toggleType = (category: MembershipCategory) => {
    setMembershipTypes((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  const submit = () => {
    if (typesMissing) {
      setShowErrors(true);
      return;
    }
    onSubmit({
      audience,
      membershipTypes: audience === "MEMBERSHIP_TYPES" ? membershipTypes : [],
      allowTeamMembers,
    });
  };

  return (
    <form
      className="flex max-h-[calc(100vh-2rem)] flex-col"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="border-b border-[#D4E0F0] p-6 pr-14">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8AA2BD]">
          <Lock className="size-3.5" /> Member access
        </p>
        <DialogTitle className="mt-1 text-lg font-semibold text-[#0B1F44]">
          {mode === "publish" ? "Publish webinar" : "Who can watch"}
        </DialogTitle>
        <DialogDescription className="mt-2 text-sm leading-6 text-[#6C7F95]">
          {mode === "publish"
            ? "Choose who sees this webinar in their dashboard. You can change access, subtitles, and translations at any time after publishing."
            : "Changes apply immediately to members who open the webinar."}
        </DialogDescription>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
        <fieldset>
          <legend className="text-xs font-semibold text-[#315F8A]">
            Audience
          </legend>
          <div className="mt-2 grid gap-2">
            {audiences.map((option) => {
              const selected = audience === option.value;
              return (
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition focus-within:ring-2 focus-within:ring-[#21466D] focus-within:ring-offset-1 ${
                    selected
                      ? "border-[#21466D] bg-[#EEF6FF]"
                      : "border-[#E1EAF4] bg-[#FBFDFF] hover:border-[#B9CEE3]"
                  }`}
                  key={option.value}
                >
                  <input
                    checked={selected}
                    className="mt-0.5 size-4 cursor-pointer accent-[#21466D]"
                    name="webinar-audience"
                    onChange={() => setAudience(option.value)}
                    type="radio"
                    value={option.value}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#0B1F44]">
                      {option.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-[#6C7F95]">
                      {option.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {audience === "MEMBERSHIP_TYPES" ? (
          <fieldset
            aria-describedby={
              typesMissing && showErrors ? "membership-types-error" : undefined
            }
          >
            <legend className="text-xs font-semibold text-[#315F8A]">
              Membership types
            </legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {membershipCategories.map((option) => {
                const checked = membershipTypes.includes(option.value);
                return (
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 transition focus-within:ring-2 focus-within:ring-[#21466D] focus-within:ring-offset-1 ${
                      checked
                        ? "border-[#21466D] bg-[#EEF6FF]"
                        : "border-[#E1EAF4] bg-white hover:border-[#B9CEE3]"
                    }`}
                    key={option.value}
                  >
                    <input
                      checked={checked}
                      className="size-4 cursor-pointer accent-[#21466D]"
                      onChange={() => toggleType(option.value)}
                      type="checkbox"
                      value={option.value}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#0B1F44]">
                        {option.value}
                      </span>
                      <span className="block text-[11px] text-[#6C7F95]">
                        {option.applicantType} accounts
                      </span>
                    </span>
                    {checked ? (
                      <Check className="size-4 text-[#21466D]" />
                    ) : null}
                  </label>
                );
              })}
            </div>
            {typesMissing && showErrors ? (
              <p
                className="mt-2 text-xs font-semibold text-[#B42318]"
                id="membership-types-error"
                role="alert"
              >
                Select at least one membership type.
              </p>
            ) : null}
          </fieldset>
        ) : null}

        <div className="flex items-start justify-between gap-4 rounded-2xl border border-[#E1EAF4] bg-[#FBFDFF] p-3.5">
          <div className="min-w-0">
            <p
              className="flex items-center gap-1.5 text-sm font-semibold text-[#0B1F44]"
              id="team-members-label"
            >
              <Users className="size-4 text-[#21466D]" /> Allow team members
            </p>
            <p
              className="mt-0.5 text-xs leading-5 text-[#6C7F95]"
              id="team-members-description"
            >
              Active team members of an eligible Business or partner account can
              watch. When off, team members never get access, even if their
              account is eligible.
            </p>
          </div>
          <button
            aria-checked={allowTeamMembers}
            aria-describedby="team-members-description"
            aria-labelledby="team-members-label"
            className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#21466D] focus-visible:ring-offset-2 ${
              allowTeamMembers
                ? "border-[#21466D] bg-[#21466D]"
                : "border-[#C8D6E6] bg-[#E7EEF6]"
            }`}
            onClick={() => setAllowTeamMembers((value) => !value)}
            role="switch"
            type="button"
          >
            <span
              aria-hidden
              className={`inline-block size-4.5 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${
                allowTeamMembers ? "translate-x-5.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="rounded-2xl border border-[#D4E0F0] bg-[#F5F9FF] p-3.5">
          <p className="text-xs font-semibold text-[#315F8A]">
            Subtitles members will see
          </p>
          <dl className="mt-1.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
            {(["ru", "en"] as const).map((language) => {
              const active = findVersion(
                subtitles,
                subtitles.activeVersionIds[language],
              );
              return (
                <div className="contents" key={language}>
                  <dt className="text-[#55708F]">{languageName[language]}</dt>
                  <dd className="text-right font-semibold text-[#0B1F44]">
                    {active ? versionName(subtitles, active) : "None"}
                  </dd>
                </div>
              );
            })}
          </dl>
          <p className="mt-2 text-[11px] leading-4 text-[#6C7F95]">
            Subtitles are optional. Members can always watch without subtitles,
            and later subtitle changes appear without republishing.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-[#D4E0F0] p-4">
        <Button
          className="h-10 rounded-xl"
          onClick={() => onOpenChange(false)}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          aria-busy={isSaving}
          className="h-10 min-w-40 rounded-xl bg-[#21466D] text-white hover:bg-[#0B1F44]"
          disabled={isSaving}
          type="submit"
        >
          {isSaving ? (
            <LoaderCircle className="motion-safe:animate-spin" />
          ) : mode === "publish" ? (
            <Send />
          ) : (
            <Check />
          )}
          {isSaving
            ? mode === "publish"
              ? "Publishing…"
              : "Saving…"
            : mode === "publish"
              ? "Publish webinar"
              : "Save access"}
        </Button>
      </div>
    </form>
  );
}
