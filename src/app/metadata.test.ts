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
import manifest from "./manifest";
import robots from "./robots";
import sitemap from "./sitemap";

describe("app metadata", () => {
  test("uses the production site url as metadata base", () => {
    expect(metadata.metadataBase?.toString()).toBe(
      "https://resume-coach-iota.vercel.app/",
    );
    expect(metadata.title).toMatchObject({
      default: "Resume Coach",
    });
  });

  test("publishes a sitemap and robots reference", () => {
    expect(robots().sitemap).toBe(
      "https://resume-coach-iota.vercel.app/sitemap.xml",
    );
    expect(sitemap()[0]?.url).toBe("https://resume-coach-iota.vercel.app");
  });

  test("publishes a manifest aligned to the site brand", () => {
    expect(manifest()).toMatchObject({
      name: "Resume Coach",
      short_name: "Resume Coach",
    });
  });
});
