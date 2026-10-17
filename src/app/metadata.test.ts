import { describe, expect, test, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Noto_Serif: () => ({
    className: "font-serif",
  }),
  Playfair_Display: () => ({
    variable: "--font-serif",
  }),
}));

import { metadata as loginMetadata } from "./(public)/login/layout";
import { metadata as signupMetadata } from "./(public)/signup/layout";
import { metadata, viewport } from "./layout";
import manifest from "./manifest";
import { metadata as homeMetadata } from "./page";
import robots from "./robots";
import sitemap from "./sitemap";

describe("app metadata", () => {
  test("uses the production site url as metadata base", () => {
    expect(metadata.metadataBase?.toString()).toBe(
      "https://resume-coach-iota.vercel.app/",
    );
  });

  test("publishes a sitemap and robots reference", () => {
    expect(robots().sitemap).toBe(
      "https://resume-coach-iota.vercel.app/sitemap.xml",
    );
    expect(sitemap()[0]?.url).toBe("https://resume-coach-iota.vercel.app");
  });

  test("keeps signed-in resume pages out of search indexes", () => {
    const rules = [robots().rules].flat();

    expect(rules.flatMap((rule) => rule.disallow ?? [])).toContain("/resume");
  });

  test("lists no sitemap url that robots tells crawlers to skip", () => {
    const disallowed = [robots().rules]
      .flat()
      .flatMap((rule) => [rule.disallow ?? []].flat());
    const paths = sitemap().map((entry) => new URL(entry.url).pathname);

    for (const path of paths) {
      expect(disallowed.filter((prefix) => path.startsWith(prefix))).toEqual(
        [],
      );
    }
  });

  test("lets crawlers reach noindex pages so the tag is honored", () => {
    const disallowed = [robots().rules]
      .flat()
      .flatMap((rule) => [rule.disallow ?? []].flat());

    for (const path of ["/login", "/signup", "/r/some-slug"]) {
      expect(disallowed.filter((prefix) => path.startsWith(prefix))).toEqual(
        [],
      );
    }
  });

  test("names the product once in the home page title", () => {
    const title = homeMetadata.title;
    const absolute =
      typeof title === "object" && title && "absolute" in title
        ? title.absolute
        : undefined;

    expect(absolute?.match(/Resume Coach/g)).toHaveLength(1);
  });

  test("matches the browser theme color to the installed app", () => {
    expect(viewport.themeColor).toBe(manifest().theme_color);
  });

  test.each([
    ["root layout", metadata],
    ["home page", homeMetadata],
    ["login", loginMetadata],
    ["signup", signupMetadata],
  ])("%s keeps a preview image for shared links", (_name, pageMeta) => {
    expect(pageMeta.openGraph?.images).toBeTruthy();
    expect(pageMeta.twitter?.images).toBeTruthy();
  });
});
