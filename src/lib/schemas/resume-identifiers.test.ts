import { describe, expect, it } from "vitest";
import { permalinkSlugSchema, resumeIdSchema } from "./resume-identifiers";

describe("resume identifiers", () => {
  it.each(["aZ09xY", "000000", "ZZZZZZ"])(
    "accepts a six-byte Base62 resume ID: %s",
    (id) => expect(resumeIdSchema.safeParse(id).success).toBe(true),
  );

  it.each(["short", "toolong7", "abc-12", "åbc123"])(
    "rejects invalid resume ID: %s",
    (id) => expect(resumeIdSchema.safeParse(id).success).toBe(false),
  );

  it.each(["abc", "Jane-Doe-2026", "A1-b2"])(
    "accepts a supported permalink slug: %s",
    (slug) => expect(permalinkSlugSchema.safeParse(slug).success).toBe(true),
  );

  it.each(["ab", "-abc", "abc-", "abc--def", "abc_def"])(
    "rejects an unsupported permalink slug: %s",
    (slug) => expect(permalinkSlugSchema.safeParse(slug).success).toBe(false),
  );
});
