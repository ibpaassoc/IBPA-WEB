import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";

/**
 * Only paths with nothing to index are blocked here. Private and transactional
 * pages (dashboard, sign-in, checkout, payment links) are kept out of search
 * with a `noindex` robots meta tag instead: a URL blocked in robots.txt cannot
 * have its `noindex` read, and can still be listed without a snippet when
 * other sites link to it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
