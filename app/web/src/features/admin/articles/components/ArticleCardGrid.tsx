"use client";

import { Newspaper, Pencil, Pin, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { getArticleVisibility } from "../server/article-admin.service";
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
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card [box-shadow:var(--card-shadow)]">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        title="No articles found"
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {articles.map((article) => {
        const isSelected = article.id === selectedId;
        const visibility = getArticleVisibility(article);

        return (
          <div
            className={cn(
              "group flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-200",
              "[box-shadow:var(--card-shadow)] hover:[box-shadow:var(--card-shadow-hover)]",
              isSelected ? "border-primary/40 ring-2 ring-primary/20" : "border-border",
            )}
            key={article.id}
            onClick={() => onEdit(article)}
          >
            {/* Cover image */}
            <div className="relative aspect-video overflow-hidden bg-muted">
              {article.coverImage ? (
                <img
                  alt={article.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                  src={article.coverImage}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Newspaper className="size-8 text-muted-foreground/30" />
                </div>
              )}
              {/* Overlay badges */}
              <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                <AdminStatusBadge
                  className="backdrop-blur-sm"
                  tone={visibility === "Published" ? "success" : "neutral"}
                >
                  {visibility}
                </AdminStatusBadge>
                {article.isPinned ? (
                  <AdminStatusBadge className="backdrop-blur-sm" tone="accent">
                    <Pin className="size-2.5" />
                    Pinned
                  </AdminStatusBadge>
                ) : null}
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col gap-1.5 p-4">
              <h3 className="line-clamp-2 font-serif text-base font-medium leading-snug text-foreground">
                {article.title}
              </h3>
              {article.body ? (
                <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {article.body}
                </p>
              ) : null}
            </div>

            {/* Actions */}
            <div
              className="flex items-center gap-1 border-t border-border px-3 py-2"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                className="h-7 gap-1.5 px-2.5 text-xs"
                onClick={() => onEdit(article)}
                type="button"
                variant="ghost"
              >
                <Pencil className="size-3" />
                Edit
              </Button>
              <div className="flex-1" />
              <Button
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(article)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
