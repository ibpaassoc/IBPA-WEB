"use client";

import { Check, Search } from "lucide-react";
import { motion } from "motion/react";
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
  const value =
    parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : base.slice(0, 2);
  return (
    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--hairline)] bg-[var(--vellum)] text-[12px] font-medium text-foreground">
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
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 rounded-full pl-9"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, or membership"
            value={query}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
          <button
            className="rounded-full border border-[var(--hairline)] bg-white px-3 py-1.5 font-medium text-foreground transition-all hover:border-[var(--hairline-strong)]"
            onClick={selectAll}
            type="button"
          >
            Select shown
          </button>
          <button
            className="rounded-full border border-[var(--hairline)] bg-white px-3 py-1.5 font-medium text-foreground transition-all hover:border-[var(--hairline-strong)]"
            onClick={clear}
            type="button"
          >
            Clear shown
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[12.5px] text-muted-foreground">
        <span>
          <span className="tabular-nums">{selectedEmails.length.toLocaleString("en-US")}</span> selected
          {filtered.length !== recipients.length
            ? `, ${filtered.length} shown of ${recipients.length}`
            : ` of ${recipients.length} members`}
        </span>
        {selectedEmails.length > 0 ? (
          <button
            className="text-foreground hairline-grow"
            onClick={() => onChange([])}
            type="button"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {recipients.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-[var(--hairline)] bg-[var(--vellum)] p-6 text-center text-sm text-muted-foreground">
          No members loaded yet.
        </p>
      ) : (
        <div className="grid max-h-[58dvh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {filtered.map((recipient, index) => {
            const isSelected = selectedSet.has(recipient.email);
            return (
              <motion.button
                key={recipient.id}
                type="button"
                onClick={() => toggle(recipient.email)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: Math.min(index * 0.015, 0.25),
                  duration: 0.32,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl border bg-white px-3.5 py-3 text-left transition-all duration-250",
                  isSelected
                    ? "border-[var(--accent-copper)] shadow-[var(--shadow-soft)]"
                    : "border-[var(--hairline)] hover:border-[var(--hairline-strong)]",
                )}
              >
                <Initials email={recipient.email} name={recipient.userName} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {recipient.userName || recipient.email}
                  </span>
                  <span className="truncate text-[11.5px] text-muted-foreground">
                    {recipient.email}
                    {recipient.cardName ? ` · ${recipient.cardName}` : ""}
                  </span>
                </div>
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
                    isSelected
                      ? "border-transparent bg-foreground text-[var(--primary-foreground)]"
                      : "border-[var(--hairline)] bg-white text-transparent",
                  )}
                >
                  <Check className="size-3.5" />
                </span>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
