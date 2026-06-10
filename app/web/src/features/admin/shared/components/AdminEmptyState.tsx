import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";

type AdminEmptyStateProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
};

export function AdminEmptyState({
  actionLabel,
  description,
  icon: Icon = Inbox,
  onAction,
  title,
}: AdminEmptyStateProps) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-[24px] border border-dashed border-[#CFE0F3] bg-[#F8FBFF] p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-[#D7E5F4] bg-white text-[#1F5D8F] shadow-[0_8px_18px_rgba(15,46,83,0.06)]">
        <Icon className="size-5" />
      </div>
      <div className="flex max-w-sm flex-col gap-1.5">
        <h3 className="text-base font-semibold text-[#10203B]">{title}</h3>
        {description ? (
          <p className="text-sm leading-6 text-[#6C7F95]">{description}</p>
        ) : null}
      </div>
      {actionLabel && onAction ? (
        <Button type="button" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
