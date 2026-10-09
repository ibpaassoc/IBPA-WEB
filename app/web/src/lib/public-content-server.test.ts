import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { formatPublicContentDate, normalizePublicContentItems } from "./public-content";
import { fetchPublicContentServer } from "./public-content-server";

const originalFetch = globalThis.fetch;
const backendEnvKeys = ["BACKEND_URL", "NEXT_PUBLIC_BACKEND_URL", "NEXT_PUBLIC_API_URL"] as const;
const originalBackendEnv = Object.fromEntries(backendEnvKeys.map((key) => [key, process.env[key]]));

beforeEach(() => {
  process.env.BACKEND_URL = "http://backend.test/";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const key of backendEnvKeys) {
    const value = originalBackendEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

test("normalizePublicContentItems fills coverAspect from the snake_case field", () => {
  const [item] = normalizePublicContentItems([{ id: "1", cover_aspect: 1.5 }]);
  assert.equal(item.coverAspect, 1.5);

  const [kept] = normalizePublicContentItems([{ id: "2", coverAspect: 2, cover_aspect: 1.5 }]);
  assert.equal(kept.coverAspect, 2);

  const [missing] = normalizePublicContentItems([{ id: "3" }]);
  assert.equal(missing.coverAspect, null);
});

test("normalizePublicContentItems treats a non-array payload as empty", () => {
  assert.deepEqual(normalizePublicContentItems(undefined), []);
  assert.deepEqual(normalizePublicContentItems({ items: [] }), []);
  assert.deepEqual(normalizePublicContentItems("nope"), []);
});

test("formatPublicContentDate is stable regardless of the runtime timezone", () => {
  // 02:00 UTC on Jul 17 is still Jul 16 in US timezones; the output must not depend on that.
  assert.equal(formatPublicContentDate("2026-07-17T02:00:00.000Z"), "July 17, 2026");
  assert.equal(formatPublicContentDate("2026-07-17T02:00:00.000Z", "short"), "Jul 17, 2026");
});

test("fetchPublicContentServer requests the tagged public endpoint and normalizes items", async () => {
  let requestedUrl = "";
  let requestedInit: RequestInit = {};
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    requestedUrl = url;
    requestedInit = init ?? {};
    return new Response(JSON.stringify({ items: [{ id: "n1", title: "Hello", cover_aspect: 1.25 }] }), {
      status: 200,
    });
  }) as typeof fetch;

  const items = await fetchPublicContentServer("news");

  assert.equal(requestedUrl, "http://backend.test/api/content/public?type=news&target=site");
  assert.deepEqual(requestedInit.next?.tags, ["public-content"]);
  assert.equal(requestedInit.next?.revalidate, 300);
  assert.equal(items?.[0].title, "Hello");
  assert.equal(items?.[0].coverAspect, 1.25);
});

test("fetchPublicContentServer returns null instead of an empty list when the backend fails", async () => {
  globalThis.fetch = (async () => new Response("boom", { status: 502 })) as typeof fetch;
  assert.equal(await fetchPublicContentServer("events"), null);

  globalThis.fetch = (async () => {
    throw new Error("network down");
  }) as typeof fetch;
  assert.equal(await fetchPublicContentServer("events"), null);

  delete process.env.BACKEND_URL;
  delete process.env.NEXT_PUBLIC_BACKEND_URL;
  delete process.env.NEXT_PUBLIC_API_URL;
  assert.equal(await fetchPublicContentServer("events"), null);
});
