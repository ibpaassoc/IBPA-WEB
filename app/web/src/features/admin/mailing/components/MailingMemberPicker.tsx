"use client";

import { Check, ChevronDown, Search, Users } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { hasTeam, toggleShownSelection } from "../server/mailing.service";
import type { MailingRecipient } from "../types/mailing.types";
import { MailingTeamPicker } from "./MailingTeamPicker";

type MailingMemberPickerProps = {
  recipients: MailingRecipient[];
  selectedEmails: string[];
  /** Seats picked one by one from an account's team dropdown. */
  selectedTeamEmails: string[];
  onChange: (emails: string[]) => void;
  onTeamChange: (emails: string[]) => void;
};

function Initials({ name, email }: { name?: string | null; email: string }) {
  const base = (name || email || "").trim();
  const parts = base.split(/[\s@]+/).filter(Boolean);
  const value = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : base.slice(0, 2);
  return (
    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D7E5F4] bg-[#EEF6FF] text-[12px] font-semibold text-[#1F5D8F]">
      {value.toUpperCase() || "M"}
    </span>
  );
}

export function MailingMemberPicker({
  onChange,
  onTeamChange,
  recipients,
  selectedEmails,
  selectedTeamEmails,
}: MailingMemberPickerProps) {
  const [query, setQuery] = useState("");
  const [openTeams, setOpenTeams] = useState<ReadonlySet<string>>(new Set());
  const deferred = useDeferredValue(query);

  const selectedSet = useMemo(() => new Set(selectedEmails), [selectedEmails]);

  const filtered = useMemo(() => {
    const needle = deferred.trim().toLowerCase();
    if (!needle) return recipients;
    return recipients.filter((recipient) => {
      const haystack = `${recipient.userName || ""} ${recipient.email} ${recipient.cardName || ""}`
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [deferred, recipients]);

  const toggle = (email: string) => {
    if (selectedSet.has(email)) {
      onChange(selectedEmails.filter((item) => item !== email));
    } else {
      onChange([...selectedEmails, email]);
    }
  };

  const toggleTeam = (recipientId: string) => {
    setOpenTeams((current) => {
      const next = new Set(current);
      if (next.has(recipientId)) next.delete(recipientId);
      else next.add(recipientId);
      return next;
    });
  };

  const changeTeamSelection = (emails: string[], isSelected: boolean) => {
    const next = new Set(selectedTeamEmails);
    for (const email of emails) {
      if (isSelected) next.add(email);
      else next.delete(email);
    }
    onTeamChange(Array.from(next));
  };

  // Bulk actions carry the shown accounts' teams with them: selecting the shown
  // members also selects their seats, and clearing takes those seats back out.
  const toggleShown = (isSelected: boolean) => {
    const next = toggleShownSelection(
      { memberEmails: selectedEmails, teamEmails: selectedTeamEmails },
      filtered,
      isSelected,
    );
    onChange(next.memberEmails);
    onTeamChange(next.teamEmails);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#8AA2BD]" />
          <Input
            className="h-10 rounded-2xl border-[#D7E5F4] bg-[#F8FBFF] pl-10 text-sm text-[#10203B] placeholder:text-[#8AA2BD] focus-visible:border-[#1F5D8F] focus-visible:ring-[#1F5D8F]/15"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, or membership"
            value={query}
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            className="rounded-full border border-[#D7E5F4] bg-white px-3 py-1.5 text-xs font-medium text-[#1F5D8F] transition-colors hover:border-[#BFD3EA] hover:bg-[#EEF6FF]"
            onClick={() => toggleShown(true)}
            type="button"
          >
            Select shown
          </button>
          <button
            className="rounded-full border border-[#D7E5F4] bg-white px-3 py-1.5 text-xs font-medium text-[#55708D] transition-colors hover:border-[#BFD3EA] hover:bg-[#EEF6FF]"
            onClick={() => toggleShown(false)}
            type="button"
          >
            Clear shown
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[#6C7F95]">
        <span>
          <span className="tabular-nums font-semibold text-[#10203B]">
            {selectedEmails.length.toLocaleString("en-US")}
          </span>{" "}
          selected
          {filtered.length !== recipients.length
            ? `, ${filtered.length} shown of ${recipients.length}`
            : ` of ${recipients.length} members`}
          {selectedTeamEmails.length > 0
            ? ` · ${selectedTeamEmails.length.toLocaleString("en-US")} team member${selectedTeamEmails.length === 1 ? "" : "s"} picked`
            : ""}
        </span>
        {selectedEmails.length > 0 || selectedTeamEmails.length > 0 ? (
          <button
            className="text-xs font-semibold text-[#1F5D8F] hover:underline"
            onClick={() => {
              onChange([]);
              onTeamChange([]);
            }}
            type="button"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {recipients.length === 0 ? (
        <p className="rounded-[20px] border border-dashed border-[#CFE0F3] bg-[#F8FBFF] p-6 text-center text-sm text-[#6C7F95]">
          No members loaded yet.
        </p>
      ) : (
        <div className="grid max-h-[58dvh] items-start gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {filtered.map((recipient) => {
            const isSelected = selectedSet.has(recipient.email);
            const showsTeam = hasTeam(recipient);
            const isTeamOpen = showsTeam && openTeams.has(recipient.id);

            return (
              <article
                className={cn(
                  "overflow-hidden rounded-2xl border bg-white transition-colors duration-200",
                  isSelected ? "border-[#1F5D8F] bg-[#F4F9FF]" : "border-[#D7E5F4]",
                )}
                key={recipient.id}
              >
                <div className="relative flex items-center gap-3 px-3.5 py-3">
                  <button
                    aria-label={`${isSelected ? "Remove" : "Add"} ${recipient.email} as a recipient`}
                    aria-pressed={isSelected}
                    className={cn(
                      "absolute inset-0 rounded-[15px] transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#1F5D8F]/15",
                      !isSelected && "hover:bg-[#F8FBFF]",
                    )}
                    onClick={() => toggle(recipient.email)}
                    type="button"
                  />

                  <div className="pointer-events-none relative z-[1]">
                    <Initials email={recipient.email} name={recipient.userName} />
                  </div>

                  <div className="pointer-events-none relative z-[1] flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-[#10203B]">
                      {recipient.userName || recipient.email}
                    </span>
                    <span className="truncate text-xs text-[#6C7F95]">
                      {recipient.email}
                      {recipient.cardName ? ` · ${recipient.cardName}` : ""}
                    </span>
                  </div>

                  {showsTeam ? (
                    <button
                      aria-expanded={isTeamOpen}
                      className={cn(
                        "pointer-events-auto relative z-10 inline-flex h-8 shrink-0 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold shadow-sm transition-colors",
                        isTeamOpen
                          ? "border-[#B9D4F0] bg-[#EEF6FF] text-[#1F5D8F]"
                          : "border-[#D7E5F4] bg-white text-[#55708D] hover:bg-[#F6FAFF]",
                      )}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleTeam(recipient.id);
                      }}
                      type="button"
                    >
                      <Users className="size-3.5" />
                      Team
                      <ChevronDown
                        className={cn("size-3 transition-transform", isTeamOpen && "rotate-180")}
                      />
                    </button>
                  ) : null}

                  <span
                    className={cn(
                      "pointer-events-none relative z-[1] flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
                      isSelected
                        ? "border-transparent bg-[#1F5D8F] text-white"
                        : "border-[#D7E5F4] bg-white text-transparent",
                    )}
                  >
                    <Check className="size-3.5" />
                  </span>
                </div>

                {isTeamOpen ? (
                  <div className="border-t border-[#D7E5F4] bg-[#F6FAFF] px-3 py-3">
                    <MailingTeamPicker
                      onChange={changeTeamSelection}
                      ownerOrderId={recipient.id}
                      selectedEmails={selectedTeamEmails}
                    />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
