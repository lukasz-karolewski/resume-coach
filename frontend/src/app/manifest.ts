import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#fff",
    description: "Gen AI powered resume builder",
    display: "standalone",
    icons: [
      {
        sizes: "any",
        src: "/favicon.ico",
        type: "image/x-icon",
      },
    ],
    lang: "en",
    name: "Resume Wiz",
    short_name: "Next.js App",
    start_url: "/",
    theme_color: "#fff",
  };
}
