import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";

import { AdminStatusBadge } from "../../shared/components/AdminStatusBadge";
import { formatAdminDate } from "../../shared/utils/admin-formatters";
import { getArticleVisibility } from "../server/article-admin.service";
import type { AdminArticle, ArticleEditorState } from "../types/article-admin.types";

type ArticlePreviewCardProps = {
  article?: AdminArticle | null;
  draft?: ArticleEditorState;
};

export function ArticlePreviewCard({ article, draft }: ArticlePreviewCardProps) {
  const title = draft?.title || article?.title || "Article title";
  const body = draft?.body || article?.body || "Article preview will appear here.";
  const ctaUrl = draft?.ctaUrl || article?.ctaUrl;
  const ctaLabel = draft?.ctaLabel || article?.ctaLabel || "Read more";
  const publishedLabel = article ? getArticleVisibility(article) : "Draft preview";

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <AdminStatusBadge tone={publishedLabel === "Published" ? "success" : "neutral"}>
          {publishedLabel}
        </AdminStatusBadge>
        {article ? (
          <span className="text-xs text-muted-foreground">{formatAdminDate(article.updatedAt)}</span>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="line-clamp-6 text-sm leading-6 text-muted-foreground">{body}</p>
      </div>
      {ctaUrl ? (
        <Button asChild type="button" variant="outline">
          <a href={ctaUrl} rel="noreferrer" target="_blank">
            <ExternalLink data-icon="inline-start" />
            {ctaLabel}
          </a>
        </Button>
      ) : null}
    </div>
  );
}
