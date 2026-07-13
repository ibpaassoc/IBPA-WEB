import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { readBackendResponse } from "./read-backend-response";

describe("readBackendResponse", () => {
  it("parses a JSON body once", async () => {
    const res = new Response(JSON.stringify({ ok: true }), { status: 200 });
    let reads = 0;
    const text = res.text.bind(res);
    res.text = () => {
      reads += 1;
      return text();
    };

    const { data } = await readBackendResponse(res);
    assert.deepEqual(data, { ok: true });
    assert.equal(reads, 1);
  });

  it("returns null data and empty text for an empty body", async () => {
    const res = new Response(null, { status: 204 });
    assert.deepEqual(await readBackendResponse(res), { data: null, text: "" });
  });

  it("returns null data but preserves text for a non-JSON body", async () => {
    const res = new Response("upstream exploded", { status: 502 });
    const { data, text } = await readBackendResponse(res);
    assert.equal(data, null);
    assert.equal(text, "upstream exploded");
  });

  it("does not clone the response", async () => {
    const res = new Response("{}", { status: 200 });
    res.clone = () => {
      throw new Error("clone must not be called");
    };
    await readBackendResponse(res);
  });
});
