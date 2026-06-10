"use client";

import { Wallet } from "lucide-react";

import { ProfilePanel } from "@/components/profile/ProfileDisplayShared";
import { useI18n } from "@/lib/i18n";
import type { ProfileService } from "@/lib/profile-record";

function normalizeServices(services: ProfileService[] | null | undefined) {
  if (!Array.isArray(services)) return [] as ProfileService[];

  return services
    .filter(
      (service): service is ProfileService =>
        Boolean(service) &&
        typeof service.id === "string" &&
        typeof service.title === "string",
    )
    .map((service) => ({
      id: service.id,
      title: service.title.trim(),
      description: service.description?.trim() || "",
      price: service.price?.trim() || "",
    }));
}

export function ProfileServicesDisplay({
  services,
  title,
  emptyLabel,
  detailsPlaceholder,
}: {
  services?: ProfileService[] | null;
  title?: string;
  emptyLabel?: string;
  detailsPlaceholder?: string;
}) {
  const { t } = useI18n();
  const items = normalizeServices(services);
  const resolvedTitle = title || t.dashboard.services.title;
  const resolvedEmptyLabel =
    emptyLabel || t.dashboard.services.empty;
  const resolvedDetailsPlaceholder =
    detailsPlaceholder || t.dashboard.services.detailsPlaceholder;

  return (
    <ProfilePanel title={resolvedTitle}>
      {items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {items.map((service) => (
            <article
              key={service.id}
              className="rounded-2xl border border-[#D8E4F3] bg-white px-4 py-3 shadow-[0_8px_20px_rgba(15,37,71,0.06)]"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 text-sm font-semibold text-[#10203B]">
                  {service.title}
                </p>

                {service.price ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#E9F2FF] px-2 py-1 text-[11px] font-semibold text-[#204E86]">
                    <Wallet className="h-3 w-3" />
                    {service.price}
                  </span>
                ) : null}
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {service.description || resolvedDetailsPlaceholder}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[22px] border border-dashed border-[#D4E0F0] bg-[#F8FBFF] px-5 py-5 text-sm leading-6 text-slate-500">
          {resolvedEmptyLabel}
        </div>
      )}
    </ProfilePanel>
  );
}
