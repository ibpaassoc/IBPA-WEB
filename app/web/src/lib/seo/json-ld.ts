import { ORGANIZATION } from "@/lib/seo/organization";
import { absoluteUrl } from "@/lib/seo/site";

export type JsonLdObject = Record<string, unknown>;

export type BreadcrumbItem = {
  name: string;
  /** Site-relative path, e.g. "/membership". */
  path: string;
};

const SCHEMA_CONTEXT = "https://schema.org";

export function organizationId() {
  return absoluteUrl("/#organization");
}

export function websiteId() {
  return absoluteUrl("/#website");
}

/**
 * Organization entity for the homepage. Only facts the site itself publishes
 * appear here (see lib/seo/organization.ts); credentials, awards, and member
 * counts are intentionally absent.
 */
export function organizationJsonLd(): JsonLdObject {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Organization",
    "@id": organizationId(),
    name: ORGANIZATION.name,
    alternateName: [...ORGANIZATION.alternateNames],
    url: absoluteUrl("/"),
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(ORGANIZATION.logoPath),
      width: ORGANIZATION.logoWidth,
      height: ORGANIZATION.logoHeight,
    },
    description: ORGANIZATION.description,
    email: ORGANIZATION.email,
    telephone: ORGANIZATION.telephone,
    address: {
      "@type": "PostalAddress",
      ...ORGANIZATION.address,
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: ORGANIZATION.email,
        telephone: ORGANIZATION.telephone,
      },
    ],
    sameAs: [...ORGANIZATION.sameAs],
    founder: {
      "@type": "Person",
      name: ORGANIZATION.founder.name,
      jobTitle: ORGANIZATION.founder.jobTitle,
    },
  };
}

/**
 * WebSite entity. `name` and `alternateName` feed Google's site-name display.
 * No SearchAction is declared because the site has no search feature.
 */
export function websiteJsonLd(): JsonLdObject {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite",
    "@id": websiteId(),
    url: absoluteUrl("/"),
    name: ORGANIZATION.name,
    alternateName: [...ORGANIZATION.alternateNames],
    inLanguage: "en",
    publisher: { "@id": organizationId() },
  };
}

/** BreadcrumbList for a page. The homepage is always the first crumb. */
export function breadcrumbJsonLd(trail: readonly BreadcrumbItem[]): JsonLdObject {
  const items: BreadcrumbItem[] = [{ name: "Home", path: "/" }, ...trail];

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * Serializes JSON-LD for inline `<script>` use. Escapes `<` so page content
 * can never close the script element, plus the two line separators that are
 * valid JSON but break older JavaScript parsers.
 */
export function serializeJsonLd(data: JsonLdObject | readonly JsonLdObject[]): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
