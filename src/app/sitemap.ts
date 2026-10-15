import type { MetadataRoute } from "next";
import { siteConfig } from "~/app/site-config";

// /login and /signup are noindex and disallowed in robots.ts, so they stay out.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      changeFrequency: "weekly",
      lastModified: new Date(),
      priority: 1,
      url: siteConfig.url,
    },
  ];
}
