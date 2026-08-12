import { describe, expect, test } from "vitest";

import { partitionResumeEducation, toResumeTextBlocks } from "./resume-content";

describe("partitionResumeEducation", () => {
  test("separates education and certifications", () => {
    const result = partitionResumeEducation([
      { id: 1, type: "EDUCATION" },
      { id: 2, type: "CERTIFICATION" },
    ]);

    expect(result.education).toEqual([{ id: 1, type: "EDUCATION" }]);
    expect(result.certificates).toEqual([{ id: 2, type: "CERTIFICATION" }]);
  });
});

describe("toResumeTextBlocks", () => {
  test("preserves paragraphs and list semantics while removing markdown syntax", () => {
    expect(
      toResumeTextBlocks(
        "Built **reliable** systems with [React](https://react.dev).\n\n- Cut latency by `40%`\n1. Mentored 4 engineers",
      ),
    ).toEqual([
      {
        kind: "paragraph",
        text: "Built reliable systems with React.",
      },
      { kind: "bullet", text: "Cut latency by 40%" },
      { kind: "bullet", text: "Mentored 4 engineers" },
    ]);
  });
});
