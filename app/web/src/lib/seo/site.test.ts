import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { CANONICAL_SITE_ORIGIN, absoluteUrl, getSeoOrigin } from "./site";

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }
});

test("a vercel.app site URL falls back to the canonical origin", () => {
  // Production once shipped with NEXT_PUBLIC_SITE_URL set to the Vercel mirror.
  process.env.NEXT_PUBLIC_SITE_URL = "https://ibpa-web.vercel.app";
  assert.equal(getSeoOrigin(), CANONICAL_SITE_ORIGIN);

  process.env.NEXT_PUBLIC_SITE_URL = "https://ibpa-web-git-main-team.vercel.app/";
  assert.equal(getSeoOrigin(), CANONICAL_SITE_ORIGIN);
});

test("a custom domain site URL is honoured", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://www.example.org/";
  assert.equal(getSeoOrigin(), "https://www.example.org");

  process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3002";
  assert.equal(getSeoOrigin(), "http://localhost:3002");
});

test("a malformed site URL falls back to the canonical origin", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "not a url";
  assert.equal(getSeoOrigin(), CANONICAL_SITE_ORIGIN);
});

test("absoluteUrl joins paths onto the SEO origin with one slash", () => {
  process.env.NEXT_PUBLIC_SITE_URL = "https://ibpa-web.vercel.app";

  assert.equal(absoluteUrl("/"), "https://ibpassociations.org/");
  assert.equal(absoluteUrl("/membership"), "https://ibpassociations.org/membership");
  assert.equal(absoluteUrl("membership"), "https://ibpassociations.org/membership");
});
