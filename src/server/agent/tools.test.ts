import { beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

const { createResumeCopy, getResume, listResumes } = vi.hoisted(() => ({
  createResumeCopy: vi.fn(),
  getResume: vi.fn(),
  listResumes: vi.fn(),
}));

vi.mock("@langchain/core/tools", () => ({
  tool: (
    fn: (
      input: unknown,
      runtime?: {
        context?: {
          currentResumeId?: number | null;
          userId?: string;
        };
      },
    ) => Promise<unknown>,
    config: { description: string; name: string; schema: z.ZodTypeAny },
  ) => ({
    ...config,
    invoke: fn,
  }),
}));

vi.mock("~/server/db", () => ({
  db: {},
}));

vi.mock("~/server/lib/job", () => ({
  fetchJobDescription: vi.fn(),
  fetchJobDescriptionSchema: z.object({
    url: z.url(),
  }),
}));

vi.mock("~/server/lib/resume", () => ({
  addExperience: vi.fn(),
  addExperienceSchema: z.object({
    accomplishments: z.string(),
    companyName: z.string(),
    endDate: z.string().optional(),
    location: z.string(),
    resumeId: z.number(),
    startDate: z.string(),
    title: z.string(),
  }),
  createResumeCopy,
  createResumeCopySchema: z.object({
    name: z.string().trim().min(1).optional(),
    sourceResumeId: z.number(),
  }),
  getResume,
  getResumeSchema: z.object({
    id: z.number(),
  }),
  listResumes,
  listResumesSchema: z
    .object({
      jobId: z.string().optional(),
    })
    .optional(),
  updateAccomplishments: vi.fn(),
  updateAccomplishmentsSchema: z.object({
    accomplishments: z.string(),
    positionId: z.number(),
  }),
  updateSkills: vi.fn(),
  updateSkillsSchema: z.object({
    positionId: z.number(),
    skills: z.array(z.string()),
  }),
  updateSummary: vi.fn(),
  updateSummarySchema: z.object({
    resumeId: z.number(),
    summary: z.string(),
  }),
}));

import { cloneResumeTool, getResumeTool, listResumesTool } from "./tools";

describe("cloneResumeTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("uses the runtime user context when cloning a resume", async () => {
    const result = {
      name: "Resume Copy",
      resumeId: 7,
      success: true,
    };
    createResumeCopy.mockResolvedValue(result);

    await expect(
      cloneResumeTool.invoke(
        { name: "Targeted Resume Copy", sourceResumeId: 7 },
        {
          context: {
            currentResumeId: 7,
            userId: "user-123",
          },
        },
      ),
    ).resolves.toEqual(result);

    expect(createResumeCopy).toHaveBeenCalledWith({}, "user-123", {
      name: "Targeted Resume Copy",
      sourceResumeId: 7,
    });
  });
});

describe("getResumeTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("uses the shared resume getter with the runtime user context", async () => {
    const result = {
      id: 42,
      name: "Test Resume",
    };
    getResume.mockResolvedValue(result);

    await expect(
      getResumeTool.invoke(
        { resumeId: 42 },
        {
          context: {
            currentResumeId: 42,
            userId: "user-123",
          },
        },
      ),
    ).resolves.toEqual(result);

    expect(getResume).toHaveBeenCalledWith({}, "user-123", { id: 42 });
  });
});

describe("listResumesTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("uses the shared list getter with the runtime user context", async () => {
    const result = [
      {
        id: 42,
        name: "Test Resume",
      },
    ];
    listResumes.mockResolvedValue(result);

    await expect(
      listResumesTool.invoke(
        {},
        {
          context: {
            currentResumeId: 42,
            userId: "user-123",
          },
        },
      ),
    ).resolves.toEqual(result);

    expect(listResumes).toHaveBeenCalledWith({}, "user-123");
  });
});
