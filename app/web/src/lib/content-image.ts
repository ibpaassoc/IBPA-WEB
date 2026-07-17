export const contentImageAspects = [
  "original",
  "16:9",
  "4:3",
  "3:2",
  "1:1",
  "4:5",
  "3:4",
] as const;

export type ContentImageAspect = (typeof contentImageAspects)[number];

/** Coordinates are normalized to the uncropped source image (0..1). */
export type NormalizedImageCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ContentImageMetadata = {
  url: string;
  key?: string | null;
  originalWidth?: number | null;
  originalHeight?: number | null;
  aspect?: ContentImageAspect | null;
  crop?: NormalizedImageCrop | null;
  zoom?: number | null;
  focalPoint?: { x: number; y: number } | null;
  alt?: string | null;
  version?: number | null;
};

export type ResolvedContentImage = ContentImageMetadata & {
  aspect: ContentImageAspect;
  crop: NormalizedImageCrop | null;
  originalWidth: number | null;
  originalHeight: number | null;
};

const aspectValues: Record<Exclude<ContentImageAspect, "original">, number> = {
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "3:2": 3 / 2,
  "1:1": 1,
  "4:5": 4 / 5,
  "3:4": 3 / 4,
};

function finitePositive(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null;
}

function isAspect(value: unknown): value is ContentImageAspect {
  return contentImageAspects.includes(value as ContentImageAspect);
}

export function normalizeImageCrop(value: unknown): NormalizedImageCrop | null {
  if (!value || typeof value !== "object") return null;

  const crop = value as Partial<NormalizedImageCrop>;
  const x = typeof crop.x === "number" ? crop.x : Number.NaN;
  const y = typeof crop.y === "number" ? crop.y : Number.NaN;
  const width = finitePositive(crop.width);
  const height = finitePositive(crop.height);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    width === null ||
    height === null ||
    x < 0 ||
    y < 0 ||
    x + width > 1.000001 ||
    y + height > 1.000001
  ) {
    return null;
  }

  return { x, y, width, height };
}

export function resolveContentImage({
  metadata,
  legacyUrl,
  legacyAspect,
  alt,
}: {
  metadata?: ContentImageMetadata | null;
  legacyUrl?: string | null;
  legacyAspect?: number | null;
  alt: string;
}): ResolvedContentImage | null {
  const url = metadata?.url?.trim() || legacyUrl?.trim();
  if (!url) return null;

  const width = finitePositive(metadata?.originalWidth);
  const height = finitePositive(metadata?.originalHeight);
  const legacyRatio = finitePositive(legacyAspect);
  const metadataAspect = isAspect(metadata?.aspect) ? metadata.aspect : null;
  const matchedLegacyAspect = legacyRatio
    ? contentImageAspects.find(
        (candidate) =>
          candidate !== "original" &&
          Math.abs(aspectValues[candidate] - legacyRatio) < 0.001,
      )
    : null;

  return {
    ...metadata,
    url,
    alt: metadata?.alt?.trim() || alt,
    aspect: metadataAspect || matchedLegacyAspect || "original",
    crop: normalizeImageCrop(metadata?.crop),
    originalWidth: width,
    originalHeight: height,
  };
}

export function getContentImageAspect(
  image: ResolvedContentImage,
  fallback = 16 / 9,
) {
  if (image.aspect !== "original") return aspectValues[image.aspect];

  if (image.crop && image.originalWidth && image.originalHeight) {
    return (
      (image.originalWidth * image.crop.width) /
      (image.originalHeight * image.crop.height)
    );
  }

  if (image.originalWidth && image.originalHeight) {
    return image.originalWidth / image.originalHeight;
  }

  return fallback;
}

export function getCroppedImageStyle(image: ResolvedContentImage) {
  if (!image.crop) return null;

  return {
    height: `${100 / image.crop.height}%`,
    left: `${(-image.crop.x / image.crop.width) * 100}%`,
    maxWidth: "none",
    position: "absolute" as const,
    top: `${(-image.crop.y / image.crop.height) * 100}%`,
    width: `${100 / image.crop.width}%`,
  };
}
