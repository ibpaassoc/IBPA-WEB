"use client";

import { Check, Pencil, X } from "lucide-react";
import { ReactNode, useState } from "react";

type EditableFieldProps = {
  value: string;
  multiline?: boolean;
  children: ReactNode;
  onSave: (value: string) => Promise<void> | void;
};

export function EditableField({
  value,
  multiline = false,
  children,
  onSave,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="relative">
        {multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            autoFocus
            className="w-full rounded-xl border border-[#C7DCF7] bg-white px-3 py-2 text-sm text-[#10203B] outline-none focus:border-[#4C7D9D]"
          />
        ) : (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            className="w-full rounded-xl border border-[#C7DCF7] bg-white px-3 py-2 text-sm text-[#10203B] outline-none focus:border-[#4C7D9D]"
          />
        )}

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-[#10203B] p-2 text-white"
          >
            <Check className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative inline-block max-w-full">
      {children}

      <button
        type="button"
        onClick={() => setEditing(true)}
        className="absolute -right-6 top-0 rounded-md p-1 text-[#4C7D9D] opacity-0 transition hover:bg-[#E9F1F8] group-hover:opacity-100"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
