"use client";

import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { AdminEmptyState } from "../../shared/components/AdminEmptyState";
import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { AdminTable } from "../../shared/components/AdminTable";
import { formatAdminDate } from "../../shared/utils/admin-formatters";
import { getArticleVisibility } from "../server/article-admin.service";
import type { AdminArticle } from "../types/article-admin.types";

type ArticlesTableProps = {
  articles: AdminArticle[];
  isLoading: boolean;
  onDelete: (article: AdminArticle) => void;
  onEdit: (article: AdminArticle) => void;
  selectedId?: string | null;
};

export function ArticlesTable({
  articles,
  isLoading,
  onDelete,
  onEdit,
  selectedId,
}: ArticlesTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton className="h-14 w-full" key={index} />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <AdminEmptyState
        description="Create a news item, update, or announcement to get started."
        title="No articles found"
      />
    );
  }

  return (
    <AdminTable
      columns={[
        {
          key: "title",
          label: "Article",
          render: (article) => (
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">{article.title}</span>
              <span className="line-clamp-1 text-xs text-muted-foreground">{article.body}</span>
            </div>
          ),
        },
        {
          key: "status",
          label: "Status",
          render: (article) => (
            <AdminStatusBadge tone={getArticleVisibility(article) === "Published" ? "success" : "neutral"}>
              {getArticleVisibility(article)}
            </AdminStatusBadge>
          ),
        },
        {
          key: "updated",
          label: "Updated",
          render: (article) => formatAdminDate(article.updatedAt),
        },
        {
          key: "actions",
          label: "Actions",
          render: (article) => (
            <div className="flex justify-end gap-1">
              <Button onClick={() => onEdit(article)} size="icon-sm" type="button" variant="ghost">
                <Pencil data-icon="inline-start" />
              </Button>
              <Button onClick={() => onDelete(article)} size="icon-sm" type="button" variant="ghost">
                <Trash2 data-icon="inline-start" />
              </Button>
            </div>
          ),
        },
      ]}
      getRowKey={(article) => article.id}
      items={articles}
      onRowClick={onEdit}
      selectedKey={selectedId}
    />
  );
}
