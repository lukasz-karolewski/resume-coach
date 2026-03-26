import { beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

const {
  addExperience,
  createResumeCopy,
  getResume,
  listResumes,
  updateAccomplishments,
  updateSkills,
  updateSummary,
} = vi.hoisted(() => ({
  addExperience: vi.fn(),
  createResumeCopy: vi.fn(),
  getResume: vi.fn(),
  listResumes: vi.fn(),
  updateAccomplishments: vi.fn(),
  updateSkills: vi.fn(),
  updateSummary: vi.fn(),
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
  addExperience,
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
  updateAccomplishments,
  updateAccomplishmentsSchema: z.object({
    accomplishments: z.string(),
    positionId: z.number(),
  }),
  updateSkills,
  updateSkillsSchema: z.object({
    positionId: z.number(),
    skills: z.array(z.string()),
  }),
  updateSummary,
  updateSummarySchema: z.object({
    resumeId: z.number(),
    summary: z.string(),
  }),
}));

import {
  addExperienceTool,
  cloneResumeTool,
  getResumeTool,
  listResumesTool,
  updateAccomplishmentsTool,
  updateSkillsTool,
  updateSummaryTool,
} from "./tools";

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

describe("updateSummaryTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("passes the runtime user context to the shared summary updater", async () => {
    updateSummary.mockResolvedValue({ resumeId: 42, success: true });

    await expect(
      updateSummaryTool.invoke(
        { summary: "Sharper summary" },
        {
          context: {
            currentResumeId: 42,
            userId: "user-123",
          },
        },
      ),
    ).resolves.toEqual({ resumeId: 42, success: true });

    expect(updateSummary).toHaveBeenCalledWith({}, "user-123", {
      resumeId: 42,
      summary: "Sharper summary",
    });
  });
});

describe("updateAccomplishmentsTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("passes the runtime user context to the shared accomplishments updater", async () => {
    updateAccomplishments.mockResolvedValue({
      positionId: 9,
      success: true,
      title: "Principal Engineer",
    });

    await expect(
      updateAccomplishmentsTool.invoke(
        {
          accomplishments: "- Improved conversion",
          positionId: 9,
        },
        {
          context: {
            currentResumeId: 42,
            userId: "user-123",
          },
        },
      ),
    ).resolves.toEqual({
      positionId: 9,
      success: true,
      title: "Principal Engineer",
    });

    expect(updateAccomplishments).toHaveBeenCalledWith({}, "user-123", {
      accomplishments: "- Improved conversion",
      positionId: 9,
    });
  });
});

describe("addExperienceTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("passes the runtime user context to the shared experience creator", async () => {
    addExperience.mockResolvedValue({
      message: "Added Principal Engineer at Tech Corp",
      success: true,
    });

    await expect(
      addExperienceTool.invoke(
        {
          accomplishments: "- Launched AI search",
          companyName: "Tech Corp",
          endDate: "2024-01-01",
          location: "Remote",
          resumeId: 42,
          startDate: "2023-01-01",
          title: "Principal Engineer",
        },
        {
          context: {
            currentResumeId: 42,
            userId: "user-123",
          },
        },
      ),
    ).resolves.toEqual({
      message: "Added Principal Engineer at Tech Corp",
      success: true,
    });

    expect(addExperience).toHaveBeenCalledWith({}, "user-123", {
      accomplishments: "- Launched AI search",
      companyName: "Tech Corp",
      endDate: "2024-01-01",
      location: "Remote",
      resumeId: 42,
      startDate: "2023-01-01",
      title: "Principal Engineer",
    });
  });
});

describe("updateSkillsTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("passes the runtime user context to the shared skills updater", async () => {
    updateSkills.mockResolvedValue({
      positionId: 9,
      skills: ["TypeScript", "Prisma ORM"],
      success: true,
    });

    await expect(
      updateSkillsTool.invoke(
        {
          positionId: 9,
          skills: ["TypeScript", "Prisma ORM"],
        },
        {
          context: {
            currentResumeId: 42,
            userId: "user-123",
          },
        },
      ),
    ).resolves.toEqual({
      positionId: 9,
      skills: ["TypeScript", "Prisma ORM"],
      success: true,
    });

    expect(updateSkills).toHaveBeenCalledWith({}, "user-123", {
      positionId: 9,
      skills: ["TypeScript", "Prisma ORM"],
    });
  });
});
