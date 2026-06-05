"use client";

import { Pencil, Trash2, Wallet } from "lucide-react";

import type { ProfileService } from "@/lib/application-profile";

export function ServiceCard({
  service,
  disabled,
  onEdit,
  onDelete,
}: {
  service: ProfileService;
  disabled?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="group flex min-h-[172px] flex-col rounded-[24px] border border-[#D8E4F3] bg-[linear-gradient(180deg,#FFFFFF_0%,#F7FAFF_100%)] p-4 shadow-[0_10px_24px_rgba(15,37,71,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(15,37,71,0.11)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-[#10203B]">
            {service.title}
          </p>

          {service.price ? (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#E9F2FF] px-3 py-1.5 text-xs font-semibold text-[#204E86]">
              <Wallet className="h-3.5 w-3.5" />
              {service.price}
            </div>
          ) : null}
        </div>
      </div>

      {service.description ? (
        <p
          className="mt-3 min-h-[40px] text-sm leading-5 text-slate-600"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {service.description}
        </p>
      ) : (
        <div className="mt-3 min-h-[40px] text-sm leading-5 text-slate-400">
          Service details can be added if needed.
        </div>
      )}

      <div className="mt-auto flex items-center justify-end gap-2 pt-4">
        <button
          type="button"
          disabled={disabled}
          onClick={onEdit}
          className="inline-flex size-9 items-center justify-center rounded-full border border-[#D7E3F2] bg-white text-[#173B70] transition hover:bg-[#F2F7FF] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`Edit ${service.title}`}
          title="Edit service"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          className="inline-flex size-9 items-center justify-center rounded-full border border-[#F4D8DC] bg-[#FFF8F9] text-[#A23A4A] transition hover:bg-[#FDECEF] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={`Delete ${service.title}`}
          title="Delete service"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
