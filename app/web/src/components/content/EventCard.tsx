"use client";

import { CalendarDays, CircleDollarSign, MapPin, Tag } from "lucide-react";
import type { ReactNode } from "react";

import type { ContentImageMetadata } from "@/lib/content-image";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { ContentImage } from "./ContentImage";
import { InteractiveContentImage } from "./InteractiveContentImage";
import { PreservedText } from "./PreservedText";

type EventCardVariant = "featured" | "standard" | "compact" | "admin";

export type EventCardMetaItem = {
  kind: "date" | "location" | "price" | "status";
  label?: string;
  value: string;
};

export type EventCardData = {
  title: string;
  description?: string | null;
  coverImage?: string | null;
  coverAspect?: number | null;
  imageMetadata?: ContentImageMetadata | null;
  eyebrow?: string | null;
};

type EventCardProps = {
  event: EventCardData;
  variant?: EventCardVariant;
  meta?: EventCardMetaItem[];
  badges?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  titleClassName?: string;
  imagePriority?: boolean;
  imageSizes?: string;
  imageLabels?: {
    open: string;
    close: string;
    loading: string;
    error: string;
  };
};

const metaIcons = {
  date: CalendarDays,
  location: MapPin,
  price: CircleDollarSign,
  status: Tag,
};

export function EventCard({
  event,
  variant = "standard",
  meta = [],
  badges,
  actions,
  footer,
  className,
  titleClassName,
  imagePriority = false,
  imageSizes = "(min-width: 768px) 42vw, 100vw",
  imageLabels,
}: EventCardProps) {
  const { t } = useI18n();
  const resolvedImageLabels = imageLabels || {
    open: t.contentImages.openFullImage,
    close: t.contentImages.closeViewer,
    loading: t.contentImages.loadingImage,
    error: t.contentImages.imageLoadFailed,
  };
  const compact = variant === "compact";
  const featured = variant === "featured";
  const hasImage = Boolean(event.imageMetadata?.url || event.coverImage);
  const media = hasImage ? (
    <InteractiveContentImage
      alt={event.imageMetadata?.alt || event.title}
      caption={event.description}
      className={cn("rounded-[22px]", featured && "lg:rounded-[28px]")}
      closeLabel={resolvedImageLabels.close}
      errorLabel={resolvedImageLabels.error}
      legacyAspect={event.coverAspect}
      legacyUrl={event.coverImage}
      loadingLabel={resolvedImageLabels.loading}
      metadata={event.imageMetadata}
      openLabel={resolvedImageLabels.open}
      priority={imagePriority}
      sizes={imageSizes}
    />
  ) : (
    <ContentImage
      alt={event.title}
      className={cn("rounded-[22px]", featured && "lg:rounded-[28px]")}
      errorLabel={resolvedImageLabels.error}
      loadingLabel={resolvedImageLabels.loading}
    />
  );

  return (
    <article
      className={cn(
        "overflow-hidden border border-[#D7E5F4] bg-white shadow-[0_18px_45px_rgba(15,46,83,0.07)]",
        featured && "rounded-[36px] p-4 sm:p-5 lg:rounded-[42px] lg:p-6",
        variant === "standard" && "rounded-[28px] p-4 sm:p-5",
        variant === "admin" && "rounded-[28px] p-5",
        compact && "rounded-[24px] p-4",
        className,
      )}
    >
      <div
        className={cn(
          "grid min-w-0 items-start gap-5",
          featured && "md:grid-cols-[minmax(240px,0.9fr)_minmax(0,1.1fr)] lg:gap-8",
          (variant === "standard" || variant === "admin") &&
            "md:grid-cols-[minmax(210px,0.82fr)_minmax(0,1.18fr)]",
          compact && "grid-cols-[minmax(84px,112px)_minmax(0,1fr)] gap-4",
        )}
      >
        <div className="min-w-0">{media}</div>

        <div className={cn("min-w-0 space-y-4", compact && "space-y-3")}>
          <div className="flex flex-wrap items-center gap-2">
            {event.eyebrow ? (
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#55708D]">
                {event.eyebrow}
              </p>
            ) : null}
            {badges}
          </div>

          <h3
            className={cn(
              "break-words font-semibold leading-[1.08] tracking-[-0.025em] text-[#10203B] [overflow-wrap:anywhere]",
              featured && "text-3xl sm:text-4xl lg:text-5xl",
              variant === "standard" && "text-2xl",
              variant === "admin" && "text-2xl",
              compact && "text-base",
              titleClassName,
            )}
          >
            {event.title}
          </h3>

          {meta.length ? (
            <dl className={cn("grid gap-2.5", !compact && "sm:grid-cols-2")}>
              {meta.map((item, index) => {
                const Icon = metaIcons[item.kind];
                return (
                  <div
                    className={cn(
                      "min-w-0",
                      compact
                        ? "flex items-start gap-2 text-[#6C7F95]"
                        : "rounded-2xl border border-[#E4EEF8] bg-[#F8FBFF] px-3.5 py-3",
                    )}
                    key={`${item.kind}-${item.label || ""}-${index}`}
                  >
                    {compact ? <Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-[#8AA2BD]" /> : null}
                    <div className="min-w-0">
                      {item.label ? (
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8AA2BD]">
                          {item.label}
                        </dt>
                      ) : null}
                      <dd
                        className={cn(
                          "break-words [overflow-wrap:anywhere]",
                          compact ? "text-xs leading-5" : "mt-1 text-sm font-semibold text-[#10203B]",
                        )}
                      >
                        {item.value}
                      </dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          ) : null}
        </div>

        {event.description ? (
          <PreservedText
            className={cn(
              "text-[#55708D]",
              compact ? "col-span-2 text-sm leading-6" : "text-base leading-7 md:col-span-2",
              featured && "text-[1.05rem] leading-8",
            )}
          >
            {event.description}
          </PreservedText>
        ) : null}

        {actions ? (
          <div
            className={cn(
              "flex flex-wrap items-center gap-3",
              compact ? "col-span-2" : "md:col-span-2",
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>

      {footer ? <div className="mt-4 border-t border-[#E4EEF8] pt-3">{footer}</div> : null}
    </article>
  );
}
