"use client";

import { Check, Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { MailingRecipient } from "../types/mailing.types";

type MailingMemberPickerProps = {
  recipients: MailingRecipient[];
  selectedEmails: string[];
  onChange: (emails: string[]) => void;
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
  recipients,
  selectedEmails,
  onChange,
}: MailingMemberPickerProps) {
  const [query, setQuery] = useState("");
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

  const selectAll = () => {
    const union = new Set([...selectedEmails, ...filtered.map((r) => r.email)]);
    onChange(Array.from(union));
  };

  const clear = () => {
    const filteredEmails = new Set(filtered.map((r) => r.email));
    onChange(selectedEmails.filter((email) => !filteredEmails.has(email)));
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
            onClick={selectAll}
            type="button"
          >
            Select shown
          </button>
          <button
            className="rounded-full border border-[#D7E5F4] bg-white px-3 py-1.5 text-xs font-medium text-[#55708D] transition-colors hover:border-[#BFD3EA] hover:bg-[#EEF6FF]"
            onClick={clear}
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
        </span>
        {selectedEmails.length > 0 ? (
          <button
            className="text-xs font-semibold text-[#1F5D8F] hover:underline"
            onClick={() => onChange([])}
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
        <div className="grid max-h-[58dvh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {filtered.map((recipient) => {
            const isSelected = selectedSet.has(recipient.email);
            return (
              <button
                className={cn(
                  "group flex items-center gap-3 rounded-2xl border bg-white px-3.5 py-3 text-left transition-colors duration-200",
                  isSelected
                    ? "border-[#1F5D8F] bg-[#F4F9FF]"
                    : "border-[#D7E5F4] hover:border-[#BFD3EA] hover:bg-[#F8FBFF]",
                )}
                key={recipient.id}
                onClick={() => toggle(recipient.email)}
                type="button"
              >
                <Initials email={recipient.email} name={recipient.userName} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold text-[#10203B]">
                    {recipient.userName || recipient.email}
                  </span>
                  <span className="truncate text-xs text-[#6C7F95]">
                    {recipient.email}
                    {recipient.cardName ? ` · ${recipient.cardName}` : ""}
                  </span>
                </div>
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors duration-200",
                    isSelected
                      ? "border-transparent bg-[#1F5D8F] text-white"
                      : "border-[#D7E5F4] bg-white text-transparent",
                  )}
                >
                  <Check className="size-3.5" />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
