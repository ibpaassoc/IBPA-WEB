import type { MetadataRoute } from "next";
import { getLandingOrigin } from "@/lib/public-urls";

const siteUrl = getLandingOrigin();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/success"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
