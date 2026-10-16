// @vitest-environment node

import { renderToBuffer } from "@react-pdf/renderer";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, test } from "vitest";

import { type ResumePdfData, ResumePdfDocument } from "./resume-pdf-viewer";

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
  test("renders resume content into a valid PDF buffer", async () => {
    const buffer = await renderToBuffer(
      <ResumePdfDocument resume={mockResume} />,
    );

    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });
});

async function pageTexts(buffer: Buffer) {
  const loadingTask = getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const texts: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const content = await (await pdf.getPage(pageNumber)).getTextContent();
    texts.push(
      content.items.map((item) => ("str" in item ? item.str : "")).join(" "),
    );
  }
  await loadingTask.destroy();
  return texts;
}

function position(title: string, accomplishments: string[]) {
  return {
    accomplishments: accomplishments.map((line) => `- ${line}`).join("\n"),
    endDate: new Date("2024-01-01T00:00:00.000Z"),
    location: "Sunnyvale, CA",
    skillPosition: [],
    startDate: new Date("2020-01-01T00:00:00.000Z"),
    title,
  };
}

const SENTENCE = "Led cross-functional teams to deliver AI-driven features. ";

describe("ResumePdfDocument pagination", () => {
  // Grow the last bullet one line at a time so the company's end sweeps past
  // the bottom of page 1. At every length the company must start on page 1 and
  // continue onto page 2, never jump there whole and leave page 1 blank.
  test.each(Array.from({ length: 12 }, (_, index) => index + 1))(
    "starts the first company on page 1 when its last bullet has %i lines",
    async (lineCount) => {
      const resume = {
        ...mockResume,
        education: [],
        experience: [
          {
            companyName: "LinkedIn",
            link: null,
            positions: [
              position(
                "Sr Staff Engineer",
                Array.from({ length: 12 }, () => SENTENCE.repeat(3)),
              ),
              position("Sr Manager, Engineering", [
                SENTENCE.repeat(2 * lineCount),
              ]),
            ],
          },
        ],
        patents: [],
        skills: [],
      } as unknown as ResumePdfData;

      const pages = await pageTexts(
        await renderToBuffer(<ResumePdfDocument resume={resume} />),
      );

      expect(pages[0]).toContain("LinkedIn");
    },
  );

  // Grow the first company line by line so the second one starts at every
  // point near the page end: its name must never sit alone at the bottom.
  test.each(Array.from({ length: 12 }, (_, index) => index + 1))(
    "keeps a company name with its first position (%i extra lines)",
    async (lineCount) => {
      const resume = {
        ...mockResume,
        education: [],
        experience: [
          {
            companyName: "LinkedIn",
            link: null,
            positions: [
              position(
                "Sr Staff Engineer",
                Array.from({ length: 13 }, () => SENTENCE.repeat(3)),
              ),
              position("Sr Manager, Engineering", [
                SENTENCE.repeat(2 * lineCount),
              ]),
            ],
          },
          {
            companyName: "Realtor",
            link: null,
            positions: [
              position(
                "Engineering Manager",
                Array.from({ length: 6 }, () => SENTENCE.repeat(3)),
              ),
            ],
          },
        ],
        patents: [],
        skills: [],
      } as unknown as ResumePdfData;

      const pages = await pageTexts(
        await renderToBuffer(<ResumePdfDocument resume={resume} />),
      );
      const companyPage = pages.find((text) => text.includes("Realtor"));

      expect(companyPage).toContain("Engineering Manager");
    },
  );
});
