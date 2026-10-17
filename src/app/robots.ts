import type { MetadataRoute } from "next";
import { siteConfig } from "~/app/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      allow: "/",
      // Signed-in screens and API routes. /login, /signup, and shared /r/ links
      // stay crawlable so crawlers can read their `noindex` meta tag; a
      // disallowed URL can still be indexed from links pointing at it.
      disallow: ["/api/", "/jobs", "/oauth/", "/profile", "/resume"],
      userAgent: "*",
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
