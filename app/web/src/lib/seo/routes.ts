export type IndexableRoute = {
  path: string;
  /**
   * ISO date of the last meaningful content change. Leave it out when the date
   * is unknown: Google only trusts `lastmod` when it is consistently accurate,
   * so an unset value is better than a build-time timestamp.
   */
  lastModified?: string;
};

/** Public pages that belong in the sitemap and may appear in search results. */
export const INDEXABLE_ROUTES: readonly IndexableRoute[] = [
  { path: "/", lastModified: "2026-10-09" },
  { path: "/about" },
  { path: "/membership" },
  { path: "/criteria" },
  { path: "/standards" },
  { path: "/governance" },
  { path: "/members" },
  { path: "/events" },
  { path: "/news" },
  { path: "/partnership" },
  { path: "/faq" },
  { path: "/contact" },
  { path: "/apply" },
  { path: "/privacy" },
  { path: "/terms" },
  { path: "/cancellation-policy" },
];

/**
 * Top-level segments under `app/(public)` that must stay out of search results.
 * They are transactional or token-based pages with no standalone value.
 */
export const NOINDEX_PUBLIC_SEGMENTS: readonly string[] = [
  "success",
  "payment-link",
  "application",
];
