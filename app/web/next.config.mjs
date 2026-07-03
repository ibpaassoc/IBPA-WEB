import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    // Cap the largest generated rendition at 2560px — the default ladder went up
    // to 3840px, which made full-bleed heroes request ~multi-MB images on
    // high-DPR screens for no visible gain.
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1600, 1920, 2560],
    formats: ["image/avif", "image/webp"],
    // Optimized renditions are immutable per (url, w, q) — let browsers/CDN keep
    // them for 31 days instead of re-validating.
    minimumCacheTTL: 2678400,
    qualities: [50, 60, 70, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.vimeocdn.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
};

export default nextConfig;
