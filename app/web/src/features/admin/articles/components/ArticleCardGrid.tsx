"use client";

import { Newspaper, Pencil, Pin, Trash2 } from "lucide-react";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { getArticleVisibility } from "../server/article-admin.service";
import type { AdminArticle } from "../types/article-admin.types";

type ArticleCardGridProps = {
  articles: AdminArticle[];
  isLoading: boolean;
  selectedId?: string | null;
  onEdit: (article: AdminArticle) => void;
  onDelete: (article: AdminArticle) => void;
};

function ArticleCardSkeleton({ feature }: { feature?: boolean }) {
  return (
    <div className={cn("card-vellum flex flex-col overflow-hidden", feature && "md:col-span-2")}>
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <div className="flex flex-col gap-2 p-6">
        <Skeleton className="h-5 w-3/4" />
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
      <div className="grid auto-rows-[1fr] gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <ArticleCardSkeleton feature />
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
    <div className="grid auto-rows-[1fr] gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {articles.map((article, index) => {
        const isSelected = article.id === selectedId;
        const visibility = getArticleVisibility(article);
        const isFeature = index === 0;

        return (
          <motion.article
            key={article.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: Math.min(0.04 + index * 0.045, 0.5),
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
              "group card-premium relative flex cursor-pointer flex-col overflow-hidden",
              isSelected && "ring-2 ring-[var(--accent-copper)]",
              isFeature && "md:col-span-2 md:row-span-2",
            )}
            onClick={() => onEdit(article)}
          >
            <div
              className={cn(
                "relative overflow-hidden bg-[var(--mist)]",
                isFeature ? "aspect-[16/10]" : "aspect-[16/11]",
              )}
            >
              {article.coverImage ? (
                <>
                  <img
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                    loading="lazy"
                    src={article.coverImage}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-[rgba(20,14,8,0.45)] via-transparent to-transparent opacity-80"
                  />
                </>
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{
                    backgroundImage:
                      "radial-gradient(80% 60% at 50% 40%, rgba(185,122,62,0.10), transparent 70%)",
                  }}
                >
                  <Newspaper className="size-10 text-foreground/20" strokeWidth={1} />
                </div>
              )}

              <div className="absolute left-4 top-4 flex flex-wrap gap-1.5">
                <span
                  className={cn(
                    "glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium tracking-tight",
                    visibility === "Published" ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        visibility === "Published" ? "var(--tone-success)" : "var(--muted-foreground)",
                    }}
                  />
                  {visibility}
                </span>
                {article.isPinned ? (
                  <span className="glass inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10.5px] font-medium text-foreground">
                    <Pin className="size-2.5" />
                    Pinned
                  </span>
                ) : null}
              </div>

              {isFeature ? (
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="editorial-eyebrow text-[11px] text-white/85">Featured</span>
                </div>
              ) : null}
            </div>

            <div className="flex flex-1 flex-col gap-3 p-6">
              <h3
                className={cn(
                  "line-clamp-2 font-serif font-medium leading-snug text-foreground",
                  isFeature ? "text-2xl tracking-tight" : "text-lg",
                )}
                style={{ textWrap: "balance" }}
              >
                {article.title}
              </h3>
              {article.body ? (
                <p
                  className={cn(
                    "leading-relaxed text-muted-foreground",
                    isFeature ? "line-clamp-3 text-sm" : "line-clamp-2 text-xs",
                  )}
                >
                  {article.body}
                </p>
              ) : null}

              <div className="flex-1" />

              <div
                className="-mb-1 flex items-center gap-1 border-t border-[var(--hairline)] pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  className="h-8 gap-1.5 rounded-full px-2.5 text-xs"
                  onClick={() => onEdit(article)}
                  type="button"
                  variant="ghost"
                >
                  <Pencil className="size-3" />
                  Edit
                </Button>
                <div className="flex-1" />
                <Button
                  className="size-8 rounded-full text-muted-foreground hover:bg-[var(--tone-warning-tint)] hover:text-destructive"
                  onClick={() => onDelete(article)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
