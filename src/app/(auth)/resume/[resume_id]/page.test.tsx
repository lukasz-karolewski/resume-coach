import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

describe("resume detail page module boundaries", () => {
  test("does not import the server Prisma client from a client component", () => {
    const pageSource = readFileSync(
      resolve(import.meta.dirname, "./page.tsx"),
      "utf8",
    );

    expect(pageSource).not.toContain("~/generated/prisma/client");
  });
});
