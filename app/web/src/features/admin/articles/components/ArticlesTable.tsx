"use client";

import { Pencil, Trash2 } from "lucide-react";

import { PreservedText } from "@/components/content/PreservedText";
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
      <div className="flex flex-col gap-3 rounded-[24px] border border-[#D7E5F4] bg-white p-4">
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
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-[#10203B]">{article.title}</span>
              <PreservedText as="span" className="text-xs text-[#6C7F95]">
                {article.body}
              </PreservedText>
            </div>
          ),
        },
        {
          key: "status",
          label: "Status",
          render: (article) => (
            <AdminStatusBadge
              tone={getArticleVisibility(article) === "Published" ? "success" : "neutral"}
            >
              {getArticleVisibility(article)}
            </AdminStatusBadge>
          ),
        },
        {
          key: "updated",
          label: "Updated",
          render: (article) => (
            <span className="text-xs text-[#6C7F95]">{formatAdminDate(article.updatedAt)}</span>
          ),
        },
        {
          key: "actions",
          label: "Actions",
          render: (article) => (
            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                className="size-8 rounded-full text-[#55708D] hover:bg-[#EEF6FF] hover:text-[#1F5D8F]"
                onClick={() => onEdit(article)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                className="size-8 rounded-full text-[#55708D] hover:bg-[#FFF5F5] hover:text-[#B42318]"
                onClick={() => onDelete(article)}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Trash2 className="size-3.5" />
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
