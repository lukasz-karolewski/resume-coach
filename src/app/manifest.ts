import type { MetadataRoute } from "next";
import { siteConfig } from "~/app/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#f8fafc",
    description: siteConfig.description,
    display: "standalone",
    icons: [
      {
        purpose: "any",
        sizes: "any",
        src: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    lang: "en",
    name: siteConfig.name,
    short_name: siteConfig.name,
    start_url: "/",
    theme_color: "#f8fafc",
  };
}
