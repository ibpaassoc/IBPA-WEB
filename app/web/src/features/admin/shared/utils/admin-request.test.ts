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
