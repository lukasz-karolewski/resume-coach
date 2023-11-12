import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Resume Wiz",
    short_name: "Next.js App",
    description: "Gen AI powered resume builder",
    start_url: "/",
    display: "standalone",
    background_color: "#fff",
    theme_color: "#fff",
    lang: "en",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
