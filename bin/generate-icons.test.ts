import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { listIconVariants, planIconOutputs } from "./generate-icons";

describe("generate-icons", () => {
  it("is wired to a package script", async () => {
    const { default: packageJson } = await import("../package.json");

    expect(packageJson.scripts.icons).toBe("tsx bin/generate-icons.ts");
  });

  it("has both source svgs for every variant", () => {
    for (const variant of listIconVariants()) {
      for (const source of ["icon.svg", "maskable.svg"]) {
        expect(existsSync(join("assets/icon", variant, source))).toBe(true);
      }
    }
  });

  it("writes manifest icons to public and the apple icon to the app dir", () => {
    expect(planIconOutputs().map(({ path }) => path)).toEqual([
      "public/icons/icon-192.png",
      "public/icons/icon-512.png",
      "public/icons/icon-maskable-512.png",
      "src/app/apple-icon.png",
    ]);
  });
});
