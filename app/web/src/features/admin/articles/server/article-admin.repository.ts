import type { AdminContentItem } from "../../shared/types/admin.types";
import { requestJson } from "../../shared/utils/admin-request";
import type { ArticleEditorState } from "../types/article-admin.types";
import { toContentImagePayload } from "@/lib/content-image";

export async function listContentItems() {
  return requestJson<{ items?: AdminContentItem[] }>(
    "/api/admin/content",
    { cache: "no-store" },
    "Could not load content.",
  );
}

export async function saveArticle(input: ArticleEditorState) {
  const payload = {
    ...input,
    coverAspect: input.coverAspect ?? 16 / 9,
    imageMetadata: toContentImagePayload(input.imageMetadata),
    type: "news",
  };
  const url = input.id ? `/api/admin/content/${encodeURIComponent(input.id)}` : "/api/admin/content";

  return requestJson<{ item?: AdminContentItem }>(
    url,
    {
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      method: input.id ? "PATCH" : "POST",
    },
    "Could not save article.",
  );
}

export async function deleteArticle(id: string) {
  return requestJson<{ success?: boolean }>(
    `/api/admin/content/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    "Could not delete article.",
  );
}
