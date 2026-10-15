import { describe, expect, test, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Noto_Serif: () => ({
    className: "font-serif",
  }),
  Playfair_Display: () => ({
    variable: "--font-serif",
  }),
}));

import { metadata } from "./layout";
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
});
