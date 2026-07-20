import assert from "node:assert/strict";
import test from "node:test";

import {
  getContentImageAspect,
  getCroppedImageStyle,
  isLightboxCloseKey,
  resolveContentImage,
  toContentImagePayload,
  type ContentImageMetadata,
} from "./content-image";
import { getEventCardLayoutClassName } from "./event-card";

test("legacy URL and numeric aspect records remain renderable", () => {
  const image = resolveContentImage({
    alt: "Legacy event",
    legacyAspect: 4 / 3,
    legacyUrl: "https://utfs.io/f/legacy.jpg",
  });

  assert.ok(image);
  assert.equal(image.url, "https://utfs.io/f/legacy.jpg");
  assert.equal(image.aspect, "4:3");
  assert.equal(image.crop, null);
  assert.equal(getContentImageAspect(image), 4 / 3);
});

test("normalized crop metadata survives the admin payload JSON round trip", () => {
  const metadata: ContentImageMetadata = {
    url: "https://utfs.io/f/cropped.jpg",
    key: "cropped-key",
    originalWidth: 2400,
    originalHeight: 1600,
    aspect: "1:1",
    crop: { x: 0.2, y: 0.1, width: 0.5, height: 0.75 },
    zoom: 1.75,
    focalPoint: { x: 0.45, y: 0.475 },
    alt: "Square crop",
    version: 1,
  };

  const payload = toContentImagePayload(metadata);
  const roundTrip = JSON.parse(JSON.stringify(payload)) as ContentImageMetadata;
  const resolved = resolveContentImage({ metadata: roundTrip, alt: "fallback" });

  assert.deepEqual(roundTrip.crop, metadata.crop);
  assert.deepEqual(roundTrip.focalPoint, metadata.focalPoint);
  assert.ok(resolved);
  assert.deepEqual(resolved.crop, metadata.crop);
  assert.deepEqual(getCroppedImageStyle(resolved), {
    height: `${100 / 0.75}%`,
    left: "-40%",
    maxWidth: "none",
    position: "absolute",
    top: `${(-0.1 / 0.75) * 100}%`,
    width: "200%",
  });
});

test("invalid legacy crop coordinates fall back without breaking the image", () => {
  const image = resolveContentImage({
    alt: "Invalid crop",
    metadata: {
      url: "/events/teora-event.webp",
      crop: { x: 0.8, y: 0, width: 0.5, height: 1 },
    },
  });

  assert.ok(image);
  assert.equal(image.crop, null);
});

test("event card layouts stack by default and become editorial columns responsively", () => {
  const featured = getEventCardLayoutClassName("featured");
  const standard = getEventCardLayoutClassName("standard");
  const compact = getEventCardLayoutClassName("compact");

  assert.match(featured, /md:grid-cols/);
  assert.match(standard, /md:grid-cols/);
  assert.match(compact, /grid-cols/);
  assert.doesNotMatch(`${featured} ${standard} ${compact}`, /(?:min-)?h-\[/);
  assert.doesNotMatch(`${featured} ${standard} ${compact}`, /line-clamp/);
});

test("the lightbox close shortcut responds only to Escape", () => {
  assert.equal(isLightboxCloseKey("Escape"), true);
  assert.equal(isLightboxCloseKey("Enter"), false);
  assert.equal(isLightboxCloseKey(" "), false);
});
