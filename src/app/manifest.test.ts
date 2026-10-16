import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import manifest from "./manifest";

function pngSize(path: string) {
  const header = readFileSync(path);
  // PNG IHDR stores width and height as big-endian uint32 at bytes 16 and 20.
  return { height: header.readUInt32BE(20), width: header.readUInt32BE(16) };
}

describe("web app manifest icons", () => {
  const icons = manifest().icons ?? [];

  test("offers home-screen sizes and a maskable icon for Android", () => {
    const pngSizes = icons
      .filter((icon) => icon.type === "image/png")
      .map((icon) => icon.sizes);

    expect(pngSizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    expect(icons.some((icon) => icon.purpose === "maskable")).toBe(true);
  });

  test("every png icon exists at the size it declares", () => {
    for (const icon of icons.filter(({ type }) => type === "image/png")) {
      const [width, height] = (icon.sizes ?? "").split("x").map(Number);

      expect(pngSize(join("public", icon.src))).toEqual({ height, width });
    }
  });

  test("ships a 180px apple touch icon", () => {
    expect(pngSize("src/app/apple-icon.png")).toEqual({
      height: 180,
      width: 180,
    });
  });
});
