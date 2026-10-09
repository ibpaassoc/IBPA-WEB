import { getLandingOrigin } from "@/lib/public-urls";

/** The one public origin search engines should index. */
export const CANONICAL_SITE_ORIGIN = "https://ibpassociations.org";

/**
 * Default share image (1200x630) used for Open Graph and Twitter cards.
 * Lives in `public/` so it is served at a stable, crawlable URL.
 */
export const DEFAULT_OG_IMAGE = {
  url: "/og/ibpa-og.jpg",
  width: 1200,
  height: 630,
  alt: "International Beauty Professionals Association (IBPA)",
} as const;

const MIRROR_HOSTNAME_PATTERN = /\.vercel\.app$/i;

/**
 * Origin used for every SEO-facing absolute URL: canonical links, Open Graph
 * URLs, sitemap entries, robots.txt, and JSON-LD.
 *
 * `NEXT_PUBLIC_SITE_URL` is honoured so local builds and a future domain move
 * keep working, but a `*.vercel.app` value is ignored. Production once shipped
 * with that variable pointing at the Vercel mirror, which made the sitemap,
 * robots.txt, and `og:image` advertise a duplicate host instead of
 * ibpassociations.org.
 */
export function getSeoOrigin(): string {
  const configured = getLandingOrigin();

  try {
    const { origin, hostname } = new URL(configured);
    if (!MIRROR_HOSTNAME_PATTERN.test(hostname)) {
      return origin;
    }
  } catch {
    // An empty or malformed value falls through to the canonical origin.
  }

  return CANONICAL_SITE_ORIGIN;
}

/** Absolute URL on the SEO origin. `absoluteUrl("/")` is the bare origin plus a slash. */
export function absoluteUrl(path = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSeoOrigin()}${normalizedPath}`;
}
