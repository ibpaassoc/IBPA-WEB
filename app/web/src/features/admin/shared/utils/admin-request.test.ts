import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { requestJson } from "./admin-request";

const originalFetch = globalThis.fetch;

function stubFetch(body: string | null, init: ResponseInit) {
  const response = new Response(body, init);
  globalThis.fetch = (() => Promise.resolve(response)) as typeof fetch;
  return response;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("admin requestJson helper", () => {
  it("returns parsed JSON on success", async () => {
    stubFetch(JSON.stringify({ items: [1, 2] }), { status: 200 });
    assert.deepEqual(await requestJson("/api/x"), { items: [1, 2] });
  });

  it("returns null for an empty success body", async () => {
    stubFetch(null, { status: 204 });
    assert.equal(await requestJson("/api/x"), null);
  });

  it("returns null for a non-JSON success body", async () => {
    stubFetch("plain text", { status: 200 });
    assert.equal(await requestJson("/api/x"), null);
  });

  it("prefers the server `error` field on failures", async () => {
    stubFetch(JSON.stringify({ error: "Nope.", details: "ignored" }), { status: 400 });
    await assert.rejects(requestJson("/api/x", undefined, "Fallback."), /^Error: Nope\.$/);
  });

  it("falls back to the server `details` field", async () => {
    stubFetch(JSON.stringify({ details: "Constraint violated." }), { status: 409 });
    await assert.rejects(requestJson("/api/x", undefined, "Fallback."), /Constraint violated\./);
  });

  it("uses a short plain-text error body as the message", async () => {
    stubFetch("Rate limit exceeded", { status: 429 });
    await assert.rejects(requestJson("/api/x", undefined, "Fallback."), /Rate limit exceeded/);
  });

  it("ignores HTML error pages and uses the fallback", async () => {
    stubFetch("<html><body>502</body></html>", { status: 502 });
    await assert.rejects(requestJson("/api/x", undefined, "Fallback."), /^Error: Fallback\.$/);
  });

  it("does not crash on an empty error body", async () => {
    stubFetch(null, { status: 500 });
    await assert.rejects(requestJson("/api/x", undefined, "Fallback."), /^Error: Fallback\.$/);
  });

  it("consumes the response body exactly once and never clones", async () => {
    const response = stubFetch(JSON.stringify({ error: "boom" }), { status: 500 });
    let reads = 0;
    let clonesAfterUse = 0;
    const text = response.text.bind(response);
    response.text = () => {
      reads += 1;
      return text();
    };
    const clone = response.clone.bind(response);
    response.clone = () => {
      if (response.bodyUsed) clonesAfterUse += 1;
      return clone();
    };

    await assert.rejects(requestJson("/api/x"), /boom/);
    assert.equal(reads, 1);
    assert.equal(clonesAfterUse, 0);
  });

  it("supports cancellation via AbortSignal", async () => {
    globalThis.fetch = ((_url: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("The operation was aborted.", "AbortError")),
        );
      });
    }) as typeof fetch;

    const controller = new AbortController();
    const pending = assert.rejects(
      requestJson("/api/x", { signal: controller.signal }),
      (error: Error) => error.name === "AbortError",
    );
    controller.abort();
    await pending;
  });
});

describe("admin requestJson session-refresh retry", () => {
  type WindowWithClerk = { Clerk?: { session?: { getToken: (options?: { skipCache?: boolean }) => Promise<string | null> } | null } };
  const globalWithWindow = globalThis as { window?: WindowWithClerk };

  function stubClerk(getToken: (options?: { skipCache?: boolean }) => Promise<string | null>) {
    globalWithWindow.window = { Clerk: { session: { getToken } } };
  }

  function stubFetchSequence(responses: Array<() => Response>) {
    let calls = 0;
    globalThis.fetch = (() => {
      const make = responses[Math.min(calls, responses.length - 1)];
      calls += 1;
      return Promise.resolve(make());
    }) as typeof fetch;
    return () => calls;
  }

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete globalWithWindow.window;
  });

  it("refreshes the session once and retries a 401", async () => {
    let refreshes = 0;
    stubClerk(async (options) => {
      refreshes += 1;
      assert.equal(options?.skipCache, true);
      return "fresh-token";
    });
    const fetchCalls = stubFetchSequence([
      () => new Response(JSON.stringify({ error: "Authentication required." }), { status: 401 }),
      () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ]);

    assert.deepEqual(await requestJson("/api/admin/content", { method: "POST", body: "{}" }), {
      ok: true,
    });
    assert.equal(fetchCalls(), 2);
    assert.equal(refreshes, 1);
  });

  it("retries at most once when the session stays invalid", async () => {
    let refreshes = 0;
    stubClerk(async () => {
      refreshes += 1;
      return "token";
    });
    const fetchCalls = stubFetchSequence([
      () => new Response(JSON.stringify({ error: "Session expired." }), { status: 401 }),
    ]);

    await assert.rejects(requestJson("/api/admin/content", { method: "POST", body: "{}" }), /Session expired\./);
    assert.equal(fetchCalls(), 2);
    assert.equal(refreshes, 1);
  });

  it("never retries a 403 — a real forbidden must not become a refresh loop", async () => {
    let refreshes = 0;
    stubClerk(async () => {
      refreshes += 1;
      return "token";
    });
    const fetchCalls = stubFetchSequence([
      () => new Response(JSON.stringify({ error: "Forbidden - admin access required" }), { status: 403 }),
    ]);

    await assert.rejects(requestJson("/api/admin/content"), /Forbidden - admin access required/);
    assert.equal(fetchCalls(), 1);
    assert.equal(refreshes, 0);
  });

  it("does not retry when the refresh fails to produce a token", async () => {
    stubClerk(async () => null);
    const fetchCalls = stubFetchSequence([
      () => new Response(JSON.stringify({ error: "Session expired." }), { status: 401 }),
    ]);

    await assert.rejects(requestJson("/api/admin/content"), /Session expired\./);
    assert.equal(fetchCalls(), 1);
  });

  it("does not retry when clerk-js is not available", async () => {
    const fetchCalls = stubFetchSequence([
      () => new Response(JSON.stringify({ error: "Session expired." }), { status: 401 }),
    ]);

    await assert.rejects(requestJson("/api/admin/content"), /Session expired\./);
    assert.equal(fetchCalls(), 1);
  });

  it("does not retry non-repeatable bodies", async () => {
    stubClerk(async () => "token");
    const fetchCalls = stubFetchSequence([
      () => new Response(JSON.stringify({ error: "Session expired." }), { status: 401 }),
    ]);
    const streamBody = new ReadableStream() as unknown as BodyInit;

    await assert.rejects(
      requestJson("/api/admin/content", { method: "POST", body: streamBody }),
      /Session expired\./,
    );
    assert.equal(fetchCalls(), 1);
  });
});
