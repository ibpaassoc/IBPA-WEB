import type { MetadataRoute } from "next";
import { getLandingOrigin } from "@/lib/public-urls";

const siteUrl = getLandingOrigin();

const routes = [
  "",
  "/about",
  "/membership",
  "/criteria",
  "/standards",
  "/contact",
  "/apply",
  "/partnership",
  "/governance",
  "/faq",
  "/news",
  "/events",
  "/privacy",
  "/terms",
  "/cancellation-policy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/apply" || route === "/membership" ? 0.9 : 0.8,
  }));
}
