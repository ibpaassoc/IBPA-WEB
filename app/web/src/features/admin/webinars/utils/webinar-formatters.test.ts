import assert from "node:assert/strict";
import test from "node:test";
import { normalizeWebinarTitle } from "./webinar-formatters";

test("webinar titles are collapsed, required, and limited to 255 characters", () => {
  assert.deepEqual(normalizeWebinarTitle("  Brow \n  tinting  "), {
    title: "Brow tinting",
    error: null,
  });
  assert.equal(normalizeWebinarTitle("   ").error, "Enter a webinar title.");
  assert.equal(normalizeWebinarTitle("a".repeat(255)).error, null);
  assert.match(normalizeWebinarTitle("a".repeat(256)).error ?? "", /255/);
});
