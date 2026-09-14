import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveSyncedTitle,
  validateWebinarTitle,
  zoomTopicTitle,
} from "./webinar-title";

test("Zoom sync follows the meeting topic until an admin renames the webinar", () => {
  assert.equal(
    resolveSyncedTitle({ currentTitle: "Old topic", previousTopic: "Old topic", incomingTitle: "New topic" }),
    "New topic",
  );
  assert.equal(
    resolveSyncedTitle({ currentTitle: "Brow masterclass", previousTopic: "Zoom meeting 42", incomingTitle: "Zoom meeting 42 (renamed in Zoom)" }),
    "Brow masterclass",
  );
  // Rows synced before topics were stored keep following Zoom.
  assert.equal(
    resolveSyncedTitle({ currentTitle: "Legacy", previousTopic: undefined, incomingTitle: "From Zoom" }),
    "From Zoom",
  );
  assert.equal(zoomTopicTitle("  "), "Untitled Zoom recording");
});

test("titles are trimmed, collapsed, required, and bounded", () => {
  assert.deepEqual(validateWebinarTitle(" Brow \n tinting "), { ok: true, value: "Brow tinting" });
  assert.equal(validateWebinarTitle("   ").ok, false);
  assert.equal(validateWebinarTitle(42).ok, false);
  assert.equal(validateWebinarTitle("a".repeat(256)).ok, false);
  assert.equal(validateWebinarTitle("a".repeat(255)).ok, true);
});
