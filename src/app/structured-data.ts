import { siteConfig } from "~/app/site-config";

/** schema.org graph describing the public site and the app it offers. */
const landingPageJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@id": `${siteConfig.url}/#website`,
      "@type": "WebSite",
      description: siteConfig.description,
      inLanguage: "en",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    {
      "@id": `${siteConfig.url}/#app`,
      "@type": "WebApplication",
      applicationCategory: "BusinessApplication",
      browserRequirements: "Requires JavaScript",
      description: siteConfig.description,
      featureList: [
        "Accomplishment log organized by role",
        "Job application tracker",
        "Tailored resumes generated from your logged accomplishments",
        "AI resume coach chat",
        "PDF export and shareable resume links",
      ],
      image: `${siteConfig.url}/icons/icon-512.png`,
      name: siteConfig.name,
      operatingSystem: "Any",
      url: siteConfig.url,
    },
  ],
};

/**
 * Serializes JSON-LD for a `<script>` tag. `JSON.stringify` leaves `<` alone,
 * so a `</script>` in any value would close the tag early; escape it.
 */
function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export { landingPageJsonLd, serializeJsonLd };
