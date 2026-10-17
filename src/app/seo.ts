import type { Metadata } from "next";
import { siteConfig } from "~/app/site-config";

/** Served by `opengraph-image.tsx` and used for both Open Graph and Twitter. */
const shareImage = {
  alt: `${siteConfig.name}: ${siteConfig.tagline}`,
  height: 630,
  url: "/opengraph-image",
  width: 1200,
} as const;

type PageMetadataInput = {
  description: string;
  path: `/${string}`;
  /** Full title used for search results and link previews. */
  title: string;
};

/**
 * Canonical URL plus Open Graph and Twitter tags for a public page.
 * Next replaces a parent's `openGraph` wholesale when a page sets its own,
 * so every page gets the full set, share image included, from here.
 */
function pageMetadata({
  description,
  path,
  title,
}: PageMetadataInput): Metadata {
  return {
    alternates: { canonical: path },
    description,
    openGraph: {
      description,
      images: [shareImage],
      locale: "en_US",
      siteName: siteConfig.name,
      title,
      type: "website",
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      description,
      images: [shareImage],
      title,
    },
  };
}

export { pageMetadata, shareImage };
