import type { AdminContentItem } from "../../shared/types/admin.types";

export type AdminArticle = AdminContentItem & {
  type: "news";
};

export type ArticleEditorState = {
  id?: string;
  title: string;
  body: string;
  coverImage: string;
  coverAspect: number | null;
  ctaUrl: string;
  ctaLabel: string;
  isPinned: boolean;
  publishToSite: boolean;
  publishToDashboard: boolean;
};

export type ArticleVisibilityFilter = "all" | "published" | "draft";
