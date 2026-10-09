import assert from "node:assert/strict";
import { test } from "node:test";

import { TITLE_SUFFIX, buildPageMetadata } from "./metadata";
import { PAGE_SEO } from "./pages";
import { INDEXABLE_ROUTES } from "./routes";

const entries = Object.entries(PAGE_SEO);

function displayedTitle(key: string, title: string) {
  return key === "home" ? title : `${title} | ${TITLE_SUFFIX}`;
}

test("every indexable route has search metadata, and vice versa", () => {
  const seoPaths = new Set(entries.map(([, page]) => page.path));
  const routePaths = new Set(INDEXABLE_ROUTES.map((route) => route.path));

  for (const routePath of routePaths) {
    assert.ok(seoPaths.has(routePath), `${routePath} is in the sitemap but has no PAGE_SEO entry`);
  }
  for (const seoPath of seoPaths) {
    assert.ok(routePaths.has(seoPath), `${seoPath} has PAGE_SEO metadata but is not in the sitemap`);
  }
});

test("titles are unique and fit a search result", () => {
  const seen = new Map<string, string>();

  for (const [key, page] of entries) {
    const title = displayedTitle(key, page.title);
    assert.ok(title.length <= 65, `${key} title is ${title.length} chars: "${title}"`);
    assert.ok(!seen.has(title), `${key} repeats the title of ${seen.get(title)}`);
    seen.set(title, key);
  }
});

test("descriptions are unique and between 70 and 160 characters", () => {
  const seen = new Map<string, string>();

  for (const [key, page] of entries) {
    const length = page.description.length;
    assert.ok(length >= 70 && length <= 160, `${key} description is ${length} chars`);
    assert.ok(!seen.has(page.description), `${key} repeats the description of ${seen.get(page.description)}`);
    seen.set(page.description, key);
  }
});

test("breadcrumb labels are present and paths are site-relative", () => {
  for (const [key, page] of entries) {
    assert.ok(page.breadcrumb.trim().length > 0, `${key} has no breadcrumb label`);
    assert.ok(page.path.startsWith("/"), `${key} path must start with a slash`);
    assert.ok(!page.path.includes("?") && !page.path.includes("#"), `${key} path must not carry a query or fragment`);
  }
});

test("buildPageMetadata sets a self-referencing canonical and matching share cards", () => {
  const metadata = buildPageMetadata(PAGE_SEO.membership);

  assert.deepEqual(metadata.alternates, { canonical: "/membership" });
  assert.equal(metadata.title, PAGE_SEO.membership.title);
  assert.equal(metadata.description, PAGE_SEO.membership.description);
  assert.equal(
    (metadata.openGraph as { title: string }).title,
    `${PAGE_SEO.membership.title} | ${TITLE_SUFFIX}`,
  );
  assert.equal((metadata.openGraph as { url: string }).url, "/membership");
  assert.equal((metadata.twitter as { card: string }).card, "summary_large_image");
  assert.equal(metadata.robots, undefined);
});

test("buildPageMetadata keeps the full title for absolute titles and supports noindex", () => {
  const home = buildPageMetadata({ ...PAGE_SEO.home, absoluteTitle: true });
  assert.deepEqual(home.title, { absolute: PAGE_SEO.home.title });
  assert.equal((home.openGraph as { title: string }).title, PAGE_SEO.home.title);

  const hidden = buildPageMetadata({ ...PAGE_SEO.apply, noindex: true });
  assert.deepEqual(hidden.robots, { index: false, follow: false });
});
