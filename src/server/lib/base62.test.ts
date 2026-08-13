import { describe, expect, it } from "vitest";
import { generateBase62Id } from "./base62";

describe("generateBase62Id", () => {
  it("generates exact-length Base62 identifiers", () => {
    const ids = Array.from({ length: 100 }, () => generateBase62Id(6));

    expect(ids.every((id) => /^[A-Za-z0-9]{6}$/.test(id))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each([0, -1, 1.5])("rejects invalid length %s", (length) => {
    expect(() => generateBase62Id(length)).toThrow();
  });
});
