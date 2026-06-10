"use client";

import { Pencil, Trash2, Wallet } from "lucide-react";

import type { ProfileService } from "@/lib/profile-record";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();

  return (
    <article className="flex w-full min-w-0 items-center gap-3 rounded-2xl border border-[#D8E4F3] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(15,37,71,0.06)] transition hover:border-[#BFD2EC] hover:bg-[#F8FBFF]">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="min-w-0 truncate text-[14px] font-semibold text-[#10203B]">
            {service.title}
          </p>

          {service.price ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#E9F2FF] px-2 py-1 text-[11px] font-semibold text-[#204E86]">
              <Wallet className="h-3 w-3" />
              {service.price}
            </span>
          ) : null}
        </div>

        <p className="mt-1 truncate text-[13px] leading-5 text-slate-500">
          {service.description || t.dashboard.services.detailsPlaceholder}
        </p>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-[#F3F7FC] p-1">
        <button
          type="button"
          disabled={disabled}
          onClick={onEdit}
          className="inline-flex size-8 items-center justify-center rounded-full bg-white text-[#173B70] shadow-sm transition hover:bg-[#EEF5FF] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={t.dashboard.services.editService(service.title)}
          title={t.dashboard.services.editTitle}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={onDelete}
          className="inline-flex size-8 items-center justify-center rounded-full bg-white text-[#A23A4A] shadow-sm transition hover:bg-[#FFF0F2] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={t.dashboard.services.deleteService(service.title)}
          title={t.dashboard.services.deleteService(service.title)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}
