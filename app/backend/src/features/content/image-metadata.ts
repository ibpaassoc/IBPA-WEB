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

/** All crop and focal-point coordinates are normalized to source pixels (0..1). */
export type ContentImageMetadata = {
  url: string;
  key?: string | null;
  originalWidth?: number | null;
  originalHeight?: number | null;
  aspect?: ContentImageAspect | null;
  crop?: { x: number; y: number; width: number; height: number } | null;
  zoom?: number | null;
  focalPoint?: { x: number; y: number } | null;
  alt?: string | null;
  version?: number | null;
};

const aspectValues: Record<Exclude<ContentImageAspect, "original">, number> = {
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "3:2": 3 / 2,
  "1:1": 1,
  "4:5": 4 / 5,
  "3:4": 3 / 4,
};

function optionalString(value: unknown, maxLength: number) {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || value.length > maxLength) {
    throw new Error("Invalid image metadata.");
  }
  return value;
}

function optionalPositiveNumber(value: unknown, max: number) {
  if (value == null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > max) {
    throw new Error("Invalid image metadata.");
  }
  return value;
}

function optionalUnitPoint(value: unknown) {
  if (value == null) return null;
  if (!value || typeof value !== "object") throw new Error("Invalid image metadata.");
  const point = value as { x?: unknown; y?: unknown };
  if (
    typeof point.x !== "number" ||
    typeof point.y !== "number" ||
    !Number.isFinite(point.x) ||
    !Number.isFinite(point.y) ||
    point.x < 0 ||
    point.x > 1 ||
    point.y < 0 ||
    point.y > 1
  ) {
    throw new Error("Invalid image metadata.");
  }
  return { x: point.x, y: point.y };
}

function optionalNormalizedCrop(value: unknown) {
  if (value == null) return null;
  if (!value || typeof value !== "object") throw new Error("Invalid image metadata.");
  const crop = value as Record<string, unknown>;
  const values = [crop.x, crop.y, crop.width, crop.height];
  if (values.some((item) => typeof item !== "number" || !Number.isFinite(item))) {
    throw new Error("Invalid image metadata.");
  }
  const x = crop.x as number;
  const y = crop.y as number;
  const width = crop.width as number;
  const height = crop.height as number;
  if (
    x < 0 ||
    y < 0 ||
    width <= 0 ||
    height <= 0 ||
    x + width > 1.000001 ||
    y + height > 1.000001
  ) {
    throw new Error("Invalid image metadata.");
  }
  return { x, y, width, height };
}

export function normalizeContentImageMetadata(
  value: unknown,
  fallbackUrl?: string | null,
): ContentImageMetadata | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid image metadata.");
  }

  const input = value as Record<string, unknown>;
  const url =
    (typeof input.url === "string" ? input.url.trim() : "") || fallbackUrl?.trim() || "";
  if (!url || url.length > 4096 || /^(blob:|data:)/i.test(url)) {
    throw new Error("Invalid image metadata.");
  }

  const aspect = input.aspect == null ? null : input.aspect;
  if (aspect !== null && !contentImageAspects.includes(aspect as ContentImageAspect)) {
    throw new Error("Invalid image metadata.");
  }

  const version = optionalPositiveNumber(input.version, 1000);
  if (version !== null && !Number.isInteger(version)) {
    throw new Error("Invalid image metadata.");
  }

  return {
    url,
    key: optionalString(input.key, 1024),
    originalWidth: optionalPositiveNumber(input.originalWidth, 100000),
    originalHeight: optionalPositiveNumber(input.originalHeight, 100000),
    aspect: aspect as ContentImageAspect | null,
    crop: optionalNormalizedCrop(input.crop),
    zoom: optionalPositiveNumber(input.zoom, 20),
    focalPoint: optionalUnitPoint(input.focalPoint),
    alt: optionalString(input.alt, 1000),
    version,
  };
}

export function getContentImageMetadataAspect(
  metadata?: ContentImageMetadata | null,
): number | null {
  if (!metadata) return null;
  if (metadata.aspect && metadata.aspect !== "original") return aspectValues[metadata.aspect];

  if (metadata.originalWidth && metadata.originalHeight) {
    if (metadata.crop) {
      return (
        (metadata.originalWidth * metadata.crop.width) /
        (metadata.originalHeight * metadata.crop.height)
      );
    }
    return metadata.originalWidth / metadata.originalHeight;
  }

  return null;
}
