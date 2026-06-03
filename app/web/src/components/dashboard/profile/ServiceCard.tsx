"use client";

import { ArrowDown, ArrowUp, Pencil, Trash2 } from "lucide-react";

import type { ProfileService } from "@/lib/application-profile";

export function ServiceCard({
  service,
  canMoveUp,
  canMoveDown,
  disabled,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  service: ProfileService;
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <article className="rounded-[28px] border border-[#D4E0F0] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold text-[#10203B]">{service.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {service.description || "No description added yet."}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={disabled || !canMoveUp}
            onClick={onMoveUp}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[#D4E0F0] bg-[#F8FBFF] text-[#16386D] transition hover:bg-[#EAF2FD] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Move ${service.title} up`}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={disabled || !canMoveDown}
            onClick={onMoveDown}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[#D4E0F0] bg-[#F8FBFF] text-[#16386D] transition hover:bg-[#EAF2FD] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Move ${service.title} down`}
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#D4E0F0] bg-white px-3 py-2 text-sm font-semibold text-[#10203B] transition hover:bg-[#F5F9FF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          className="inline-flex items-center gap-2 rounded-2xl border border-[#F1CFD4] bg-[#FFF7F8] px-3 py-2 text-sm font-semibold text-[#A23A4A] transition hover:bg-[#FDECEF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </article>
  );
}
