import { describe, expect, test } from "vitest";
import { siteConfig } from "~/app/site-config";
import { landingPageJsonLd, serializeJsonLd } from "./structured-data";

describe("structured data", () => {
  test("cannot close the surrounding script tag", () => {
    const json = serializeJsonLd({ name: "</script><script>alert(1)" });

    expect(json).not.toContain("<");
    expect(JSON.parse(json)).toEqual({ name: "</script><script>alert(1)" });
  });

  test("describes the site and app at the canonical url", () => {
    const graph = landingPageJsonLd["@graph"];

    expect(graph.map((node) => node["@type"])).toEqual([
      "WebSite",
      "WebApplication",
    ]);
    for (const node of graph) {
      expect(node.url).toBe(siteConfig.url);
    }
  });
});
