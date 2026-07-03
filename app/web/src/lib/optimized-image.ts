/**
 * Helpers for routing remote images (member uploads on utfs.io, Vimeo posters,
 * Unsplash) through the Next.js image optimizer so the UI never downloads the
 * original multi-MB upload.
 */

/** Hosts allowed in next.config.mjs `images.remotePatterns`. */
const OPTIMIZABLE_HOSTS = new Set([
  "utfs.io",
  "i.vimeocdn.com",
  "images.unsplash.com",
]);

export function isOptimizableRemoteUrl(src: string): boolean {
  try {
    const url = new URL(src);
    if (url.protocol !== "https:") return false;
    if (!OPTIMIZABLE_HOSTS.has(url.hostname)) return false;
    // The optimizer refuses SVGs by default; serve them as-is.
    if (url.pathname.toLowerCase().endsWith(".svg")) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Widths must exist in the optimizer ladder (imageSizes + deviceSizes).
 * Used for fixed-size UI images (avatars, small thumbnails) rendered through
 * plain <img> elements such as Radix AvatarImage.
 */
export type ThumbWidth = 48 | 64 | 96 | 128 | 256 | 384 | 640;

/**
 * Returns a Next.js image-optimizer URL for a remote image so small UI slots
 * (40px avatars, list thumbnails) download a ~few-KB rendition instead of the
 * original upload. Falls back to the original URL for hosts the optimizer
 * does not allow.
 */
export function thumbnailUrl(
  src: string | null | undefined,
  width: ThumbWidth = 96,
): string | undefined {
  if (!src) return undefined;
  if (!isOptimizableRemoteUrl(src)) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=70`;
}
