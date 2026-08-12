// @vitest-environment node

import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, test } from "vitest";

import {
  type ResumePdfData,
  ResumePdfDocument,
  resumePdfStyles,
} from "./resume-pdf-viewer";

const mockResume = {
  contactInfo: {
    email: "jane@example.com",
    name: "Jane Doe",
    phone: "555-0100",
  },
  education: [
    {
      distinction: "BSc Computer Science",
      endDate: new Date("2018-06-01T00:00:00.000Z"),
      id: 31,
      institution: "Example University",
      link: "https://example.edu",
      notes: null,
      startDate: new Date("2014-09-01T00:00:00.000Z"),
      type: "EDUCATION",
    },
  ],
  experience: [
    {
      companyName: "Acme",
      id: 12,
      link: "https://example.com",
      positions: [
        {
          accomplishments: "- Reduced deployment time by **50%**",
          endDate: new Date("2024-01-01T00:00:00.000Z"),
          id: 34,
          location: "Remote",
          skillPosition: [],
          startDate: new Date("2022-01-01T00:00:00.000Z"),
          title: "Staff Engineer",
        },
      ],
    },
  ],
  id: 7,
  name: "Platform Resume",
  patents: [
    {
      date: new Date("2021-06-01T00:00:00.000Z"),
      description: "Reduced stale reads in distributed systems.",
      id: 52,
      link: "https://patents.example.com/cache",
      title: "Adaptive cache invalidation",
    },
  ],
  skills: [{ id: 61, skill: { id: 62, name: "TypeScript" } }],
  summary: "Builds reliable systems.",
} as unknown as ResumePdfData;

describe("ResumePdfDocument", () => {
  test("keeps links black", () => {
    expect(resumePdfStyles.link).toMatchObject({ color: "#111827" });
  });

  test("stacks icon-led contact details without a divider", () => {
    expect(resumePdfStyles.contactDetails).toMatchObject({
      flexDirection: "column",
      gap: 3,
    });
    expect(resumePdfStyles.contactDetails).not.toHaveProperty("marginTop");
    expect(resumePdfStyles.header).toMatchObject({ gap: 4 });
    expect(resumePdfStyles.header).not.toHaveProperty("borderBottomWidth");
    expect(resumePdfStyles.name).toMatchObject({ lineHeight: 1.2 });
  });

  test("renders resume content into a valid PDF buffer", async () => {
    const buffer = await renderToBuffer(
      <ResumePdfDocument resume={mockResume} />,
    );

    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });
});
