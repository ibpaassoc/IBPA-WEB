import assert from "node:assert/strict";
import test from "node:test";

import { normalizeEventPayload } from "@/features/events/server/event.service";
import { normalizeArticlePayload } from "@/features/news/server/article.service";
import { normalizeContentImageMetadata } from "./image-metadata";

const imageMetadata = {
  url: "https://utfs.io/f/source.jpg",
  key: "source-key",
  originalWidth: 3000,
  originalHeight: 2000,
  aspect: "4:3" as const,
  crop: { x: 0.1, y: 0.2, width: 0.8, height: 0.6 },
  zoom: 1.25,
  focalPoint: { x: 0.5, y: 0.5 },
  alt: "A content image",
  version: 1,
};

test("server validation accepts and preserves normalized presentation metadata", () => {
  const serialized = JSON.parse(JSON.stringify(imageMetadata));
  assert.deepEqual(normalizeContentImageMetadata(serialized), imageMetadata);
});

test("server validation rejects temporary URLs and out-of-bounds crops", () => {
  assert.throws(
    () => normalizeContentImageMetadata({ ...imageMetadata, url: "blob:temporary" }),
    /Invalid image metadata/,
  );
  assert.throws(
    () =>
      normalizeContentImageMetadata({
        ...imageMetadata,
        crop: { x: 0.5, y: 0, width: 0.75, height: 1 },
      }),
    /Invalid image metadata/,
  );
});

test("article create payload carries image metadata and the legacy URL", () => {
  const normalized = normalizeArticlePayload({
    title: " Article title ",
    body: "Line one\nLine two",
    coverImage: imageMetadata.url,
    imageMetadata,
  });

  assert.equal(normalized.title, "Article title");
  assert.equal(normalized.coverImage, imageMetadata.url);
  assert.deepEqual(normalized.imageMetadata, imageMetadata);
});

test("event edit payload keeps its id and derives the legacy aspect", () => {
  const normalized = normalizeEventPayload({
    id: "d2078863-6ac6-4a5e-9798-3b2c5f3df111",
    title: "Event",
    body: "Details",
    coverImage: imageMetadata.url,
    imageMetadata,
    publishToDashboard: true,
  });

  assert.equal(normalized.id, "d2078863-6ac6-4a5e-9798-3b2c5f3df111");
  assert.equal(normalized.coverImageUrl, imageMetadata.url);
  assert.equal(normalized.coverAspect, 4 / 3);
  assert.deepEqual(normalized.imageMetadata, imageMetadata);
});
