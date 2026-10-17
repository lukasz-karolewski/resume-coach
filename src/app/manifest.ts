import type { MetadataRoute } from "next";
import { manifestIcons } from "~/app/app-icons";
import { siteConfig } from "~/app/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: siteConfig.themeColor,
    description: siteConfig.description,
    display: "standalone",
    icons: [
      {
        purpose: "any",
        sizes: "any",
        src: "/icon.svg",
        type: "image/svg+xml",
      },
      ...manifestIcons.map(({ purpose, size, src }) => ({
        purpose,
        sizes: `${size}x${size}`,
        src,
        type: "image/png",
      })),
    ],
    lang: "en",
    name: siteConfig.name,
    short_name: siteConfig.name,
    start_url: "/",
    theme_color: siteConfig.themeColor,
  };
}
