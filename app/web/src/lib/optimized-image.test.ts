import assert from "node:assert/strict";
import test from "node:test";

import { isOptimizableRemoteUrl } from "./optimized-image";

test("current and legacy UploadThing image hosts use the Next image optimizer", () => {
  assert.equal(isOptimizableRemoteUrl("https://utfs.io/f/legacy-image"), true);
  assert.equal(
    isOptimizableRemoteUrl("https://727t7gwhri.ufs.sh/f/current-image"),
    true,
  );
  assert.equal(isOptimizableRemoteUrl("https://ufs.sh/f/current-image"), true);
});

test("untrusted, insecure, and SVG image URLs bypass the optimizer", () => {
  assert.equal(isOptimizableRemoteUrl("https://example.com/image.jpg"), false);
  assert.equal(isOptimizableRemoteUrl("http://utfs.io/f/image"), false);
  assert.equal(isOptimizableRemoteUrl("https://utfs.io/f/image.svg"), false);
});
