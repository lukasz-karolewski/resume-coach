import { describe, expect, test } from "vitest";

import { normalizeResumeSort, type ResumeSort } from "./resume-sort";

describe("normalizeResumeSort", () => {
  test.each<[string | string[] | undefined, ResumeSort]>([
    [undefined, "last-updated"],
    ["unknown", "last-updated"],
    ["created", "created"],
    ["name", "name"],
    [["created", "name"], "created"],
  ])("normalizes %j to %s", (input, expected) => {
    expect(normalizeResumeSort(input)).toBe(expected);
  });
});
