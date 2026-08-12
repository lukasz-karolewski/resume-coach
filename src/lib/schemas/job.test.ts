import { describe, expect, test } from "vitest";

import { addJobSchema } from "./job";

describe("addJobSchema", () => {
  test("accepts the application fields used by the tracker", () => {
    const result = addJobSchema.safeParse({
      company: "Acme",
      location: "Remote",
      nextActionAt: new Date("2026-08-20T00:00:00.000Z"),
      notes: "Follow up",
      resumeId: 7,
      status: "APPLIED",
      title: "Staff Engineer",
      url: "https://example.com/jobs/1",
    });

    expect(result.success).toBe(true);
  });

  test("rejects an application without a company, position, or valid URL", () => {
    const result = addJobSchema.safeParse({
      company: "",
      status: "SAVED",
      title: "",
      url: "not a URL",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues).toHaveLength(3);
  });
});
