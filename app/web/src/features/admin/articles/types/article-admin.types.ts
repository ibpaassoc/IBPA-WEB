import type { AdminContentItem } from "../../shared/types/admin.types";
import type { ContentImageMetadata } from "@/lib/content-image";

export type AdminArticle = AdminContentItem & {
  type: "news";
};

export type ArticleEditorState = {
  id?: string;
  title: string;
  body: string;
  coverImage: string;
  coverAspect: number | null;
  imageMetadata: ContentImageMetadata | null;
  ctaUrl: string;
  ctaLabel: string;
  isPinned: boolean;
  publishToSite: boolean;
  publishToDashboard: boolean;
};

export type ArticleVisibilityFilter = "all" | "published" | "draft";
