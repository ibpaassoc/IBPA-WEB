"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { Loader2, Save, X } from "lucide-react";

import type { ProfileService } from "@/lib/application-profile";

type ServiceDraft = {
  title: string;
  price: string;
  description: string;
};

const TITLE_MAX = 80;
const PRICE_MAX = 40;
const DESCRIPTION_MAX = 500;

function normalizeDraft(service?: ProfileService | null): ServiceDraft {
  return {
    title: service?.title || "",
    price: service?.price || "",
    description: service?.description || "",
  };
}

function getValidationErrors(draft: ServiceDraft) {
  const title = draft.title.trim();
  const price = draft.price.trim();
  const description = draft.description.trim();

  return {
    title: !title
      ? "Service title is required."
      : title.length > TITLE_MAX
        ? `Service title must be ${TITLE_MAX} characters or fewer.`
        : "",
    price:
      price.length > PRICE_MAX
        ? `Price must be ${PRICE_MAX} characters or fewer.`
        : "",
    description:
      description.length > DESCRIPTION_MAX
        ? `Service description must be ${DESCRIPTION_MAX} characters or fewer.`
        : "",
  };
}

export function ServiceEditor({
  service,
  saving,
  onCancel,
  onSave,
}: {
  service?: ProfileService | null;
  saving?: boolean;
  onCancel: () => void;
  onSave: (value: ServiceDraft) => void;
}) {
  const [draft, setDraft] = useState<ServiceDraft>(() => normalizeDraft(service));
  const errors = getValidationErrors(draft);
  const hasErrors = Boolean(
    errors.title ||
      errors.price ||
      errors.description,
  );

  useEffect(() => {
    setDraft(normalizeDraft(service));
  }, [service]);

  return (
    <div className="rounded-[24px] border border-[#D6E2F1] bg-[linear-gradient(180deg,#FFFFFF_0%,#F7FAFF_100%)] p-4 shadow-[0_10px_24px_rgba(15,37,71,0.08)]">
      <div className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#16386D]">
          {service ? "Edit Service" : "New Service"}
        </p>
      </div>

      <div className="grid gap-3">
        <div>
          <label
            htmlFor="service-title"
            className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500"
          >
            Title
          </label>
          <input
            id="service-title"
            type="text"
            maxLength={TITLE_MAX}
            value={draft.title}
            onChange={(event) =>
              setDraft((current) => ({ ...current, title: event.target.value }))
            }
            placeholder="Hair Coloring"
            className="w-full rounded-[18px] border border-[#D8E4F3] bg-white px-4 py-3 text-sm text-[#10203B] outline-none transition focus:border-[#2B5C99]"
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-xs">
            <span className="text-[#D14343]">{errors.title}</span>
            <span className="text-slate-400">{draft.title.trim().length}/{TITLE_MAX}</span>
          </div>
        </div>

        <div>
            <label
              htmlFor="service-price"
              className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500"
            >
              Price
            </label>
            <input
              id="service-price"
              type="text"
              maxLength={PRICE_MAX}
              value={draft.price}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  price: event.target.value,
                }))
              }
              placeholder="$120"
              className="w-full rounded-[18px] border border-[#D8E4F3] bg-white px-4 py-3 text-sm text-[#10203B] outline-none transition focus:border-[#2B5C99]"
            />
            <div className="mt-2 flex items-center justify-between gap-3 text-xs">
              <span className="text-[#D14343]">{errors.price}</span>
              <span className="text-slate-400">
                {draft.price.trim().length}/{PRICE_MAX}
              </span>
            </div>
        </div>

        <div>
          <label
            htmlFor="service-description"
            className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500"
          >
            Description
          </label>
          <textarea
            id="service-description"
            maxLength={DESCRIPTION_MAX}
            value={draft.description}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            rows={4}
            placeholder="Balayage, highlights, color correction."
            className="w-full resize-none rounded-[18px] border border-[#D8E4F3] bg-white px-4 py-3 text-sm leading-6 text-[#10203B] outline-none transition focus:border-[#2B5C99]"
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-xs">
            <span className="text-[#D14343]">{errors.description}</span>
            <span className="text-slate-400">
              {draft.description.trim().length}/{DESCRIPTION_MAX}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving || hasErrors}
          onClick={() =>
            onSave({
              title: draft.title.trim(),
              price: draft.price.trim(),
              description: draft.description.trim(),
            })
          }
          className="inline-flex items-center gap-2 rounded-full bg-[#16386D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#102c59] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-full border border-[#D4E0F0] bg-white px-4 py-2 text-sm font-semibold text-[#10203B] transition hover:bg-[#F5F9FF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}
