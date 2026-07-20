"use client";

import {
  CalendarDays,
  ExternalLink,
  Globe,
  LayoutDashboard,
  Newspaper,
  Pencil,
  Pin,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { InteractiveContentImage } from "@/components/content/InteractiveContentImage";
import { PreservedText } from "@/components/content/PreservedText";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { formatAdminDate } from "../../shared/utils/admin-formatters";
import type { AdminArticle } from "../types/article-admin.types";

type ArticleCardGridProps = {
  articles: AdminArticle[];
  isLoading: boolean;
  selectedId?: string | null;
  onEdit: (article: AdminArticle) => void;
  onDelete: (article: AdminArticle) => void;
};

function ArticleCardSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden rounded-[24px] border border-[#D7E5F4] bg-white p-4">
      <Skeleton className="size-24 shrink-0 rounded-2xl" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

function ArticleThumbnail({ article }: { article: AdminArticle }) {
  if (!article.coverImage) {
    return (
      <div className="flex aspect-square size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#EEF6FF] sm:size-28">
        <Newspaper className="size-7 text-[#BFD3EA]" strokeWidth={1.25} />
      </div>
    );
  }

  return (
    <div className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-[#EEF6FF] sm:size-28">
      <InteractiveContentImage
        alt={article.title}
        caption={article.body}
        className="h-full rounded-2xl"
        legacyAspect={article.coverAspect ?? article.cover_aspect}
        legacyUrl={article.coverImage}
        metadata={article.imageMetadata}
        sizes="112px"
      />
    </div>
  );
}

/** Icon-only publish target indicators: active = solid blue chip, inactive = muted. */
function PublishIcons({
  publishToSite,
  publishToDashboard,
}: {
  publishToSite: boolean;
  publishToDashboard: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full transition-colors",
          publishToSite ? "bg-[#1F5D8F] text-white" : "bg-[#EEF6FF] text-[#BFD3EA]",
        )}
        title={publishToSite ? "Visible on the public site" : "Not on the public site"}
      >
        <Globe className="size-2.5" />
      </span>
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full transition-colors",
          publishToDashboard ? "bg-[#1F5D8F] text-white" : "bg-[#EEF6FF] text-[#BFD3EA]",
        )}
        title={
          publishToDashboard
            ? "Visible in the member dashboard"
            : "Not in the member dashboard"
        }
      >
        <LayoutDashboard className="size-2.5" />
      </span>
    </div>
  );
}

export function ArticleCardGrid({
  articles,
  isLoading,
  onDelete,
  onEdit,
  selectedId,
}: ArticleCardGridProps) {
  if (isLoading) {
    return (
      <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <AdminEmptyState
        description="Create an article or change the current filters."
        title="No articles yet"
      />
    );
  }

  return (
    // items-start: cards keep their natural height — one long card does not
    // stretch its row siblings.
    <div className="grid items-start gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {articles.map((article) => {
        const isSelected = article.id === selectedId;
        const hasCta = Boolean(article.ctaUrl);

        return (
          <article
            className={cn(
              "group flex cursor-pointer flex-col gap-3 rounded-[24px] border bg-white p-4 shadow-[0_18px_45px_rgba(15,46,83,0.06)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(15,46,83,0.09)]",
              isSelected ? "border-[#1F5D8F] ring-4 ring-[#1F5D8F]/10" : "border-[#D7E5F4]",
            )}
            key={article.id}
            onClick={() => onEdit(article)}
          >
            <div className="flex gap-4">
              <ArticleThumbnail article={article} />

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-start gap-2">
                  <h3
                    className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug text-[#10203B]"
                    style={{ textWrap: "balance" }}
                  >
                    {article.title}
                  </h3>
                  {article.isPinned ? (
                    <Pin
                      aria-label="Pinned"
                      className="size-3.5 shrink-0 text-[#1F5D8F]"
                    />
                  ) : null}
                </div>

                {article.body ? (
                  <PreservedText
                    className="line-clamp-3 text-xs leading-5 text-[#6C7F95]"
                    style={{ textWrap: "pretty" }}
                  >
                    {article.body}
                  </PreservedText>
                ) : null}

                <div className="flex items-center gap-1.5 text-xs text-[#6C7F95]">
                  <CalendarDays className="size-3 shrink-0 text-[#8AA2BD]" />
                  <span className="tabular-nums">{formatAdminDate(article.updatedAt)}</span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <PublishIcons
                    publishToDashboard={article.publishToDashboard}
                    publishToSite={article.publishToSite}
                  />
                  {hasCta ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-[#D7E5F4] bg-[#F6FAFF] px-2 py-0.5 text-[10px] font-semibold text-[#55708D]"
                      title={article.ctaUrl ?? ""}
                    >
                      <ExternalLink className="size-2.5" />
                      {article.ctaLabel || "CTA"}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div
              className="flex items-center gap-1 border-t border-[#E4EEF8] pt-3"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                aria-label="Edit article"
                className="size-8 rounded-full text-[#1F5D8F] hover:bg-[#EEF6FF]"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(article);
                }}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Pencil className="size-3.5" />
              </Button>
              <div className="flex-1" />
              <Button
                aria-label="Delete article"
                className="size-8 rounded-full text-[#55708D] hover:bg-[#FFF5F5] hover:text-[#B42318]"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(article);
                }}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
