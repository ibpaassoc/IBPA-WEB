import type { AdminContentItem } from "../../shared/types/admin.types";
import type {
  AdminArticle,
  ArticleEditorState,
  ArticleVisibilityFilter,
} from "../types/article-admin.types";

export const emptyArticleEditorState: ArticleEditorState = {
  body: "",
  coverAspect: 16 / 9,
  coverImage: "",
  imageMetadata: null,
  ctaLabel: "Read more",
  ctaUrl: "",
  isPinned: false,
  publishToDashboard: false,
  publishToSite: true,
  title: "",
};

export function normalizeArticle(item: AdminContentItem): AdminArticle {
  return {
    ...item,
    body: item.body ?? "",
    coverAspect: item.coverAspect ?? item.cover_aspect ?? 16 / 9,
    coverImage: item.coverImage ?? "",
    imageMetadata: item.imageMetadata ?? null,
    ctaLabel: item.ctaLabel ?? "Read more",
    ctaUrl: item.ctaUrl ?? "",
    isPinned: Boolean(item.isPinned),
    publishToDashboard: Boolean(item.publishToDashboard),
    publishToSite: Boolean(item.publishToSite),
    title: item.title ?? "",
    type: "news",
  };
}

export function toArticleEditorState(article?: AdminArticle | null): ArticleEditorState {
  if (!article) {
    return { ...emptyArticleEditorState };
  }

  return {
    body: article.body,
    coverAspect: article.coverAspect ?? article.cover_aspect ?? 16 / 9,
    coverImage: article.coverImage ?? "",
    imageMetadata: article.imageMetadata ?? null,
    ctaLabel: article.ctaLabel || "Read more",
    ctaUrl: article.ctaUrl || "",
    id: article.id,
    isPinned: Boolean(article.isPinned),
    publishToDashboard: Boolean(article.publishToDashboard),
    publishToSite: Boolean(article.publishToSite),
    title: article.title,
  };
}

export function getArticleVisibility(article: Pick<AdminArticle, "publishToSite" | "publishToDashboard">) {
  if (article.publishToSite || article.publishToDashboard) {
    return "Published";
  }

  return "Draft";
}

export function filterArticles(
  articles: AdminArticle[],
  params: { query: string; visibility: ArticleVisibilityFilter },
) {
  const query = params.query.trim().toLowerCase();

  return articles.filter((article) => {
    if (params.visibility === "published" && !article.publishToSite && !article.publishToDashboard) {
      return false;
    }

    if (params.visibility === "draft" && (article.publishToSite || article.publishToDashboard)) {
      return false;
    }

    if (!query) return true;

    return [article.title, article.body, article.ctaLabel]
      .some((value) => String(value || "").toLowerCase().includes(query));
  });
}
