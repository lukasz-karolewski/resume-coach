import type { MetadataRoute } from "next";
import { siteConfig } from "~/app/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: "/",
      disallow: ["/login", "/private/", "/resume", "/signup"],
      userAgent: "*",
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
