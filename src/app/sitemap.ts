import type { MetadataRoute } from "next";
import { siteConfig } from "~/app/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      changeFrequency: "weekly",
      lastModified: new Date(),
      priority: 1,
      url: siteConfig.url,
    },
    {
      changeFrequency: "monthly",
      lastModified: new Date(),
      priority: 0.6,
      url: `${siteConfig.url}/login`,
    },
    {
      changeFrequency: "monthly",
      lastModified: new Date(),
      priority: 0.6,
      url: `${siteConfig.url}/signup`,
    },
  ];
}
