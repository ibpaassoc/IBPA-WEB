import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  breadcrumbJsonLd,
  organizationJsonLd,
  serializeJsonLd,
  websiteJsonLd,
} from "./json-ld";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
});

function collectStrings(value: unknown, found: string[] = []): string[] {
  if (typeof value === "string") {
    found.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, found));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectStrings(item, found));
  }
  return found;
}

test("organization JSON-LD carries identity, logo, contact, and profile fields", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://ibpa-web.vercel.app";
  const org = organizationJsonLd() as Record<string, any>;

  assert.equal(org["@context"], "https://schema.org");
  assert.equal(org["@type"], "Organization");
  assert.equal(org["@id"], "https://ibpassociations.org/#organization");
  assert.equal(org.name, "International Beauty Professionals Association");
  assert.ok(org.alternateName.includes("IBPA"));
  assert.equal(org.url, "https://ibpassociations.org/");
  assert.equal(org.logo.url, "https://ibpassociations.org/branding/logo-header.webp");
  assert.ok(org.logo.width >= 112 && org.logo.height >= 112, "Google requires a logo of at least 112x112");
  assert.equal(org.address["@type"], "PostalAddress");
  assert.equal(org.address.addressLocality, "Roseville");
  assert.equal(org.contactPoint[0].email, "support@ibpassociations.org");
  assert.deepEqual(org.sameAs, ["https://www.instagram.com/bbeauty_forum/"]);
});

test("organization JSON-LD makes no unverifiable claims", () => {
  const text = collectStrings(organizationJsonLd()).join(" ").toLowerCase();

  for (const forbidden of ["award", "accredit", "certified by", "endorsed", "members worldwide", "ranked"]) {
    assert.ok(!text.includes(forbidden), `Organization JSON-LD must not mention "${forbidden}"`);
  }
});

test("every URL in the structured data is absolute and on the canonical origin", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://ibpa-web.vercel.app";
  const blocks = [
    organizationJsonLd(),
    websiteJsonLd(),
    breadcrumbJsonLd([{ name: "Membership", path: "/membership" }]),
  ];

  const urls = collectStrings(blocks).filter((value) => /^https?:\/\//.test(value));
  assert.ok(urls.length > 0);
  for (const url of urls) {
    const isSocialProfile = url.startsWith("https://www.instagram.com/");
    const isSchemaContext = url === "https://schema.org";
    assert.ok(
      url.startsWith("https://ibpassociations.org") || isSocialProfile || isSchemaContext,
      `${url} is not on the canonical origin`,
    );
  }
});

test("website JSON-LD names the site and references the organization", () => {
  const site = websiteJsonLd() as Record<string, any>;

  assert.equal(site["@type"], "WebSite");
  assert.equal(site.name, "International Beauty Professionals Association");
  assert.ok(site.alternateName.includes("IBPA"));
  assert.equal(site.publisher["@id"], (organizationJsonLd() as Record<string, any>)["@id"]);
  assert.equal("potentialAction" in site, false, "no SearchAction: the site has no search");
});

test("breadcrumb JSON-LD starts at Home and numbers positions from 1", () => {
  const crumbs = breadcrumbJsonLd([
    { name: "Resources", path: "/resources" },
    { name: "Guide", path: "/resources/guide" },
  ]) as Record<string, any>;

  assert.equal(crumbs["@type"], "BreadcrumbList");
  assert.deepEqual(
    crumbs.itemListElement.map((item: any) => [item.position, item.name]),
    [
      [1, "Home"],
      [2, "Resources"],
      [3, "Guide"],
    ],
  );
  assert.equal(crumbs.itemListElement[2].item.endsWith("/resources/guide"), true);
});

test("serializeJsonLd cannot break out of its script element", () => {
  const output = serializeJsonLd({
    "@type": "Thing",
    name: "</script><script>alert(1)</script>",
    note: "line separator",
  });

  assert.ok(!output.includes("</script>"));
  assert.ok(!output.includes("<"));
  assert.ok(!output.includes(" "));
  assert.equal(JSON.parse(output).name, "</script><script>alert(1)</script>");
});
