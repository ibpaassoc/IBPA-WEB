import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PreservedText } from "@/components/content/PreservedText";

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
    <div className="flex flex-col gap-5 rounded-[24px] border border-[#D7E5F4] bg-white p-6 shadow-[0_18px_45px_rgba(15,46,83,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <AdminStatusBadge tone={publishedLabel === "Published" ? "success" : "neutral"}>
          {publishedLabel}
        </AdminStatusBadge>
        {article ? (
          <span className="text-xs text-[#6C7F95]">{formatAdminDate(article.updatedAt)}</span>
        ) : null}
      </div>
      <div className="flex flex-col gap-3">
        <h3
          className="text-2xl font-semibold tracking-[-0.02em] text-[#10203B]"
          style={{ textWrap: "balance" }}
        >
          {title}
        </h3>
        <PreservedText
          className="text-sm leading-7 text-[#55708D]"
          style={{ textWrap: "pretty" }}
        >
          {body}
        </PreservedText>
      </div>
      {ctaUrl ? (
        <Button
          asChild
          className="h-10 w-fit rounded-2xl border-[#D7E5F4] bg-white text-[#1F5D8F] hover:bg-[#EEF6FF]"
          type="button"
          variant="outline"
        >
          <a href={ctaUrl} rel="noreferrer" target="_blank">
            <ExternalLink data-icon="inline-start" />
            {ctaLabel}
          </a>
        </Button>
      ) : null}
    </div>
  );
}
