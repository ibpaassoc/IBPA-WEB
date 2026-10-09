import type { MetadataRoute } from "next";
import { INDEXABLE_ROUTES } from "@/lib/seo/routes";
import { absoluteUrl } from "@/lib/seo/site";

/**
 * Google ignores `priority` and `changefreq`, and only trusts `lastmod` when
 * it is accurate, so entries carry a `lastModified` only when a real date is
 * recorded in `INDEXABLE_ROUTES`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_ROUTES.map(({ path, lastModified }) => ({
    url: absoluteUrl(path),
    ...(lastModified ? { lastModified } : {}),
  }));
}
