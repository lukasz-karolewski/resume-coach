import { describe, expect, it } from "vitest";

import { normalizePrismaSqliteUrl } from "~/server/prisma-url";

describe("normalizePrismaSqliteUrl", () => {
  it("keeps non-sqlite URLs unchanged", () => {
    expect(normalizePrismaSqliteUrl("postgresql://localhost:5432/app")).toBe(
      "postgresql://localhost:5432/app",
    );
  });

  it("resolves relative sqlite paths from the prisma directory", () => {
    expect(normalizePrismaSqliteUrl("file:./dev.db")).toBe(
      "file:./prisma/dev.db",
    );
  });

  it("preserves sqlite query parameters while normalizing paths", () => {
    expect(normalizePrismaSqliteUrl("file:./dev.db?connection_limit=1")).toBe(
      "file:./prisma/dev.db?connection_limit=1",
    );
  });

  it("preserves in-memory sqlite URLs", () => {
    expect(normalizePrismaSqliteUrl("file::memory:")).toBe("file::memory:");
  });
});
