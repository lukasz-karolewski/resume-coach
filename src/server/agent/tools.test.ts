import { beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

const {
  addExperience,
  createResumeCopy,
  deleteResume,
  getResume,
  listResumes,
  updateAccomplishments,
  updateSkills,
  updateSummary,
} = vi.hoisted(() => ({
  addExperience: vi.fn(),
  createResumeCopy: vi.fn(),
  deleteResume: vi.fn(),
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
    resumeId: z
      .string()
      .length(6)
      .regex(/^[0-9A-Za-z]+$/),
    startDate: z.string(),
    title: z.string(),
  }),
  createResumeCopy,
  createResumeCopySchema: z.object({
    name: z.string().trim().min(1).optional(),
    sourceResumeId: z
      .string()
      .length(6)
      .regex(/^[0-9A-Za-z]+$/),
  }),
  deleteResume,
  getResume,
  getResumeSchema: z.object({
    id: z
      .string()
      .length(6)
      .regex(/^[0-9A-Za-z]+$/),
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
    resumeId: z
      .string()
      .length(6)
      .regex(/^[0-9A-Za-z]+$/),
    summary: z.string(),
  }),
}));

import {
  addExperienceTool,
  cloneResumeTool,
  deleteResumeTool,
  getResumeTool,
  listResumesTool,
  openResumeTool,
  updateAccomplishmentsTool,
  updateSkillsTool,
  updateSummaryTool,
} from "./tools";

describe("deleteResumeTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("deletes only a resume owned by the runtime user", async () => {
    deleteResume.mockResolvedValue({ success: true });

    await expect(
      deleteResumeTool.invoke(
        { resumeId: "Res077" },
        {
          context: {
            currentResumeId: null,
            userId: "user-123",
          },
        },
      ),
    ).resolves.toEqual({ resumeId: "Res077", success: true });

    expect(deleteResume).toHaveBeenCalledWith({}, "user-123", {
      id: "Res077",
    });
  });

  test("reports ownership and missing-resume failures", async () => {
    deleteResume.mockRejectedValue(new Error("Resume not found"));

    await expect(
      deleteResumeTool.invoke(
        { resumeId: "Res077" },
        {
          context: {
            currentResumeId: null,
            userId: "user-123",
          },
        },
      ),
    ).resolves.toEqual({ error: "Resume not found" });
  });
});

describe("openResumeTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("confirms the resume the UI should open", async () => {
    getResume.mockResolvedValue({ id: 42, name: "Targeted Resume" });

    await expect(
      openResumeTool.invoke(
        { resumeId: "Res042" },
        {
          context: {
            currentResumeId: "Res007",
            userId: "user-123",
          },
        },
      ),
    ).resolves.toEqual({
      name: "Targeted Resume",
      opened: true,
      resumeId: "Res042",
    });

    expect(getResume).toHaveBeenCalledWith({}, "user-123", {
      id: "Res042",
    });
  });

  test("reports an error when the resume does not belong to the user", async () => {
    getResume.mockRejectedValue(new Error("Resume not found"));

    await expect(
      openResumeTool.invoke(
        { resumeId: "Res042" },
        {
          context: {
            currentResumeId: "Res007",
            userId: "user-123",
          },
        },
      ),
    ).resolves.toEqual({ error: "Resume not found" });
  });
});

describe("cloneResumeTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("uses the runtime user context when cloning a resume", async () => {
    const result = {
      name: "Resume Copy",
      resumeId: "Res007",
      success: true,
    };
    createResumeCopy.mockResolvedValue(result);

    await expect(
      cloneResumeTool.invoke(
        { name: "Targeted Resume Copy", sourceResumeId: "Res007" },
        {
          context: {
            currentResumeId: "Res007",
            userId: "user-123",
          },
        },
      ),
    ).resolves.toEqual(result);

    expect(createResumeCopy).toHaveBeenCalledWith({}, "user-123", {
      name: "Targeted Resume Copy",
      sourceResumeId: "Res007",
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
        { resumeId: "Res042" },
        {
          context: {
            currentResumeId: "Res042",
            userId: "user-123",
          },
        },
      ),
    ).resolves.toEqual(result);

    expect(getResume).toHaveBeenCalledWith({}, "user-123", {
      id: "Res042",
    });
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
            currentResumeId: "Res042",
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
    updateSummary.mockResolvedValue({ resumeId: "Res042", success: true });

    await expect(
      updateSummaryTool.invoke(
        { summary: "Sharper summary" },
        {
          context: {
            currentResumeId: "Res042",
            userId: "user-123",
          },
        },
      ),
    ).resolves.toEqual({ resumeId: "Res042", success: true });

    expect(updateSummary).toHaveBeenCalledWith({}, "user-123", {
      resumeId: "Res042",
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
            currentResumeId: "Res042",
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
          resumeId: "Res042",
          startDate: "2023-01-01",
          title: "Principal Engineer",
        },
        {
          context: {
            currentResumeId: "Res042",
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
      resumeId: "Res042",
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
            currentResumeId: "Res042",
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
