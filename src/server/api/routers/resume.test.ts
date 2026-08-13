import { beforeEach, describe, expect, test, vi } from "vitest";
import { EducationType } from "~/generated/prisma/client";
import type { createTRPCContext } from "~/server/api/trpc";
import { resumeRouter } from "./resume";

type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

// Mock database with proper vi.fn() for all methods
const createMockDb = () => {
  const db = {
    contactInfo: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
    },
    education: {
      create: vi.fn(),
      createMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    experience: {
      create: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    job: {
      findFirst: vi.fn(),
    },
    patent: {
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    position: {
      createMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    positionSkill: {
      deleteMany: vi.fn(),
    },
    resume: {
      create: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    section: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
    },
  };

  return {
    ...db,
    $transaction: vi.fn(async (callback: (transaction: typeof db) => unknown) =>
      callback(db),
    ),
  };
};

let mockDb: ReturnType<typeof createMockDb>;

// Mock session
const mockSession: NonNullable<TRPCContext["session"]> = {
  session: {
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    expiresAt: new Date("2026-01-02T00:00:00.000Z"),
    id: "session-123",
    token: "test-token",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    userId: "user-123",
  },
  user: {
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    email: "test@example.com",
    emailVerified: true,
    id: "user-123",
    name: "Test User",
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  },
};

// Create caller helper
const createCaller = () => {
  const ctx: TRPCContext = {
    db: mockDb as unknown as TRPCContext["db"],
    headers: new Headers(),
    session: mockSession,
  };

  return resumeRouter.createCaller(ctx);
};

describe("Resume Router", () => {
  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe("addSectionItem", () => {
    test("adds initial content to a section on the authenticated user's resume", async () => {
      mockDb.resume.findFirst.mockResolvedValue({ id: "Res001" });
      mockDb.section.findFirst.mockResolvedValue(null);
      mockDb.patent.create.mockResolvedValue({ id: 4 });

      const result = await createCaller().addSectionItem({
        date: "2021-06",
        description: "A distributed systems patent.",
        resumeId: "Res001",
        title: "Adaptive cache invalidation",
        type: "PATENTS",
      });

      expect(result).toMatchObject({ id: "Res001" });
      expect(mockDb.resume.findFirst).toHaveBeenCalledWith({
        select: { id: true },
        where: { id: "Res001", userId: "user-123" },
      });
    });
  });

  describe("section item mutations", () => {
    test("updates, deletes, and removes owned patent content", async () => {
      mockDb.resume.findFirst.mockResolvedValue({ id: "Res001" });
      mockDb.patent.findFirst.mockResolvedValue({ id: 4 });
      const caller = createCaller();

      await caller.updateSectionItem({
        date: "2024-03",
        description: "Updated description.",
        itemId: 4,
        resumeId: "Res001",
        title: "Updated patent",
        type: "PATENTS",
      });
      await caller.deleteSectionItem({
        itemId: 4,
        resumeId: "Res001",
        type: "PATENTS",
      });
      await caller.removeSection({ resumeId: "Res001", type: "PATENTS" });

      expect(mockDb.patent.update).toHaveBeenCalled();
      expect(mockDb.patent.delete).toHaveBeenCalledWith({ where: { id: 4 } });
      expect(mockDb.patent.deleteMany).toHaveBeenCalledWith({
        where: { resumeId: "Res001" },
      });
      expect(mockDb.section.deleteMany).toHaveBeenCalledWith({
        where: { resumeId: "Res001", type: "PATENTS" },
      });
    });
  });

  describe("create", () => {
    test("should create a resume with all fields", async () => {
      const mockContactInfo = {
        email: "john@example.com",
        id: "Res001",
        name: "John Doe",
        phone: "123-456-7890",
      };
      const mockResume = {
        contactInfo: mockContactInfo,
        contactInfoId: 1,
        createdAt: new Date(),
        education: [
          {
            distinction: "BS CS",
            endDate: new Date("2014-06-01"),
            id: 1,
            institution: "Stanford",
            link: "https://stanford.edu",
            location: "Stanford, CA",
            notes: null,
            resumeId: "Res001",
            startDate: new Date("2010-09-01"),
            type: EducationType.EDUCATION,
          },
        ],
        experience: [
          {
            companyName: "Tech Corp",
            id: 1,
            link: "https://techcorp.com",
            positions: [
              {
                accomplishments: JSON.stringify([
                  "Led team",
                  "Improved performance",
                ]),
                endDate: new Date("2023-12-31"),
                experienceId: 1,
                id: 1,
                location: "San Francisco, CA",
                startDate: new Date("2020-01-01"),
                title: "Senior Engineer",
              },
            ],
            resumeId: "Res001",
          },
        ],
        id: 1,
        jobId: null,
        name: "My Resume",
        summary: JSON.stringify(["Summary line 1", "Summary line 2"]),
        updatedAt: new Date(),
        userId: "user-123",
      };

      mockDb.contactInfo.create.mockResolvedValue(mockContactInfo);
      mockDb.resume.create.mockResolvedValue(mockResume);

      const caller = createCaller();
      const result = await caller.create({
        contactInfo: {
          email: "john@example.com",
          name: "John Doe",
          phone: "123-456-7890",
        },
        education: [
          {
            distinction: "BS CS",
            endDate: new Date("2014-06-01"),
            institution: "Stanford",
            link: "https://stanford.edu",
            location: "Stanford, CA",
            startDate: new Date("2010-09-01"),
            type: EducationType.EDUCATION,
          },
        ],
        experience: [
          {
            companyName: "Tech Corp",
            link: "https://techcorp.com",
            positions: [
              {
                accomplishments: "- Led team\n- Improved performance",
                endDate: new Date("2023-12-31"),
                location: "San Francisco, CA",
                startDate: new Date("2020-01-01"),
                title: "Senior Engineer",
              },
            ],
          },
        ],
        name: "My Resume",
        professionalSummary: "Summary line 1\n\nSummary line 2",
      });

      // Contact info is created separately before resume
      expect(mockDb.contactInfo.create).toHaveBeenCalledWith({
        data: {
          email: "john@example.com",
          name: "John Doe",
          phone: "123-456-7890",
        },
      });
      expect(mockDb.resume.create).toHaveBeenCalled();
      expect(result.id).toBe(1);
      expect(result.name).toBe("My Resume");
    });

    test("should create resume without contact info", async () => {
      const mockResume = {
        contactInfo: null,
        contactInfoId: null,
        createdAt: new Date(),
        education: [],
        experience: [],
        id: 2,
        jobId: null,
        name: "Minimal Resume",
        summary: "[]",
        updatedAt: new Date(),
        userId: "user-123",
      };

      mockDb.resume.create.mockResolvedValue(mockResume);

      const caller = createCaller();
      const result = await caller.create({
        name: "Minimal Resume",
      });

      expect(mockDb.contactInfo.create).not.toHaveBeenCalled();
      expect(result.id).toBe(2);
    });

    test("should throw error when creating resume with non-existent jobId", async () => {
      mockDb.job.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      await expect(
        caller.create({
          jobId: "non-existent-job-id",
          name: "Resume for fake job",
        }),
      ).rejects.toThrow("Job not found or does not belong to user");
    });

    test("should handle empty string jobId as undefined", async () => {
      const mockResume = {
        contactInfo: null,
        contactInfoId: null,
        createdAt: new Date(),
        education: [],
        experience: [],
        id: 4,
        jobId: null,
        name: "Resume with empty jobId",
        summary: "[]",
        updatedAt: new Date(),
        userId: "user-123",
      };

      mockDb.resume.create.mockResolvedValue(mockResume);

      const caller = createCaller();
      const result = await caller.create({
        jobId: "", // Empty string should be treated as undefined
        name: "Resume with empty jobId",
      });

      // Job lookup should NOT be called for empty string
      expect(mockDb.job.findFirst).not.toHaveBeenCalled();
      expect(result.jobId).toBeNull();
    });

    test("should create resume with valid jobId", async () => {
      const mockJob = {
        company: "Tech Corp",
        createdAt: new Date(),
        description: "Job description",
        id: "job-123",
        notes: null,
        title: "Senior Engineer",
        url: "https://example.com/job",
        userId: "user-123",
      };

      const mockResume = {
        contactInfo: null,
        contactInfoId: null,
        createdAt: new Date(),
        education: [],
        experience: [],
        id: 3,
        Job: mockJob,
        jobId: "job-123",
        name: "Resume for Tech Corp",
        summary: "[]",
        updatedAt: new Date(),
        userId: "user-123",
      };

      mockDb.job.findFirst.mockResolvedValue(mockJob);
      mockDb.resume.create.mockResolvedValue(mockResume);

      const caller = createCaller();
      const result = await caller.create({
        jobId: "job-123",
        name: "Resume for Tech Corp",
      });

      expect(mockDb.job.findFirst).toHaveBeenCalledWith({
        where: {
          id: "job-123",
          userId: "user-123",
        },
      });
      expect(result.jobId).toBe("job-123");
    });
  });

  describe("getById", () => {
    test("should return resume with parsed JSON fields", async () => {
      const mockResume = {
        contactInfo: {
          email: "john@test.com",
          id: 1,
          name: "John",
          phone: "123",
        },
        contactInfoId: 1,
        createdAt: new Date(),
        education: [],
        experience: [
          {
            companyName: "Company",
            id: 1,
            link: "https://company.com",
            positions: [
              {
                accomplishments: JSON.stringify([
                  "Achievement 1",
                  "Achievement 2",
                ]),
                endDate: null,
                experienceId: 1,
                id: 1,
                location: "Remote",
                skillPosition: [],
                startDate: new Date(),
                title: "Engineer",
              },
            ],
            resumeId: "Res001",
          },
        ],
        id: 1,
        Job: null,
        jobId: null,
        name: "Test Resume",
        summary: JSON.stringify(["Summary 1", "Summary 2"]),
        updatedAt: new Date(),
        userId: "user-123",
      };

      mockDb.resume.findFirst.mockResolvedValue(mockResume);

      const caller = createCaller();
      const result = await caller.getById({ id: "Res001" });

      expect(result.summary).toBe(JSON.stringify(["Summary 1", "Summary 2"]));
      expect(result.experience[0]?.positions[0]?.accomplishments).toBe(
        JSON.stringify(["Achievement 1", "Achievement 2"]),
      );
      expect(mockDb.resume.findFirst).toHaveBeenCalledWith({
        include: expect.any(Object),
        where: { id: "Res001", userId: "user-123" },
      });
    });

    test("should throw NOT_FOUND when resume does not exist", async () => {
      mockDb.resume.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      await expect(caller.getById({ id: "Res999" })).rejects.toThrow(
        "Resume not found",
      );
    });

    test("should not return resume from different user", async () => {
      mockDb.resume.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      await expect(caller.getById({ id: "Res001" })).rejects.toThrow(
        "Resume not found",
      );
      expect(mockDb.resume.findFirst).toHaveBeenCalledWith({
        include: expect.any(Object),
        where: { id: "Res001", userId: "user-123" },
      });
    });
  });

  describe("list", () => {
    test("should return all user resumes", async () => {
      const mockDbResumes = [
        {
          _count: { education: 1, experience: 2 },
          contactInfo: {
            email: "john@test.com",
            id: 1,
            name: "John",
            phone: "123",
          },
          contactInfoId: 1,
          createdAt: new Date(),
          id: 1,
          Job: null,
          jobId: null,
          name: "Resume 1",
          summary: JSON.stringify(["Summary"]),
          updatedAt: new Date(),
          userId: "user-123",
        },
        {
          _count: { education: 2, experience: 1 },
          contactInfo: {
            email: "john@test.com",
            id: 1,
            name: "John",
            phone: "123",
          },
          contactInfoId: 1,
          createdAt: new Date(),
          id: 2,
          Job: {
            company: "Company",
            createdAt: new Date(),
            description: null,
            id: "job-123",
            notes: null,
            title: "Role",
            url: "https://job.com",
            userId: "user-123",
          },
          jobId: "job-123",
          name: "Resume 2",
          summary: "[]",
          updatedAt: new Date(),
          userId: "user-123",
        },
      ];

      mockDb.resume.findMany.mockResolvedValue(mockDbResumes);

      const caller = createCaller();
      const result = await caller.list();

      expect(result).toHaveLength(2);
      expect(result[0]?.summary).toBe(JSON.stringify(["Summary"]));
      expect(result[1]?.summary).toBe("[]");

      expect(mockDb.resume.findMany).toHaveBeenCalledWith({
        include: expect.any(Object),
        orderBy: { updatedAt: "desc" },
        where: { userId: "user-123" },
      });
    });

    test("should filter by jobId", async () => {
      mockDb.resume.findMany.mockResolvedValue([]);

      const caller = createCaller();
      await caller.list({ jobId: "job-123" });

      expect(mockDb.resume.findMany).toHaveBeenCalledWith({
        include: expect.any(Object),
        orderBy: { updatedAt: "desc" },
        where: { jobId: "job-123", userId: "user-123" },
      });
    });
  });

  describe("update", () => {
    test("should update resume fields", async () => {
      const existingResume = {
        contactInfoId: 1,
        createdAt: new Date(),
        id: 1,
        jobId: null,
        name: "Old Name",
        summary: "[]",
        updatedAt: new Date(),
        userId: "user-123",
      };

      const updatedResume = {
        ...existingResume,
        contactInfo: {
          email: "john@test.com",
          id: 1,
          name: "John",
          phone: "123",
        },
        education: [],
        experience: [],
        name: "New Name",
        summary: JSON.stringify(["New summary"]),
      };

      mockDb.resume.findFirst.mockResolvedValue(existingResume);
      mockDb.resume.update.mockResolvedValue(updatedResume);

      const caller = createCaller();
      const result = await caller.update({
        id: "Res001",
        name: "New Name",
        professionalSummary: "New summary",
      });

      expect(result.name).toBe("New Name");
      expect(result.summary).toBe(JSON.stringify(["New summary"]));
    });

    test("should throw NOT_FOUND when updating non-existent resume", async () => {
      mockDb.resume.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      await expect(
        caller.update({ id: "Res999", name: "Test" }),
      ).rejects.toThrow("Resume not found");
    });

    test("should update contact info if provided", async () => {
      const existingResume = {
        contactInfoId: 1,
        createdAt: new Date(),
        id: "Res001",
        jobId: null,
        name: "Resume",
        summary: "[]",
        updatedAt: new Date(),
        userId: "user-123",
      };

      mockDb.resume.findFirst.mockResolvedValue(existingResume);
      mockDb.contactInfo.update.mockResolvedValue({
        email: "new@test.com",
        id: 1,
        name: "Updated",
        phone: "456",
      });
      mockDb.resume.update.mockResolvedValue({
        ...existingResume,
        contactInfo: {
          email: "new@test.com",
          id: 1,
          name: "Updated",
          phone: "456",
        },
        education: [],
        experience: [],
      });

      const caller = createCaller();
      await caller.update({
        contactInfo: { email: "new@test.com", name: "Updated", phone: "456" },
        id: "Res001",
      });

      expect(mockDb.contactInfo.update).toHaveBeenCalled();
    });
  });

  describe("updateTitle", () => {
    test("should update only the resume title", async () => {
      const existingResume = {
        createdAt: new Date(),
        id: "Res001",
        name: "Old Name",
        updatedAt: new Date(),
        userId: "user-123",
      };

      mockDb.resume.findFirst.mockResolvedValue(existingResume);
      mockDb.resume.update.mockResolvedValue({
        ...existingResume,
        name: "New Name",
      });

      const caller = createCaller();
      const result = await caller.updateTitle({
        id: "Res001",
        name: "New Name",
      });

      expect(result.name).toBe("New Name");
      expect(mockDb.resume.update).toHaveBeenCalledWith({
        data: {
          name: "New Name",
        },
        where: {
          id: "Res001",
        },
      });
      expect(mockDb.contactInfo.update).not.toHaveBeenCalled();
    });

    test("should throw NOT_FOUND when updating the title of a missing resume", async () => {
      mockDb.resume.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      await expect(
        caller.updateTitle({ id: "Res999", name: "Test" }),
      ).rejects.toThrow("Resume not found");
    });
  });

  describe("updateAccomplishments", () => {
    test("should update accomplishments for an owned position", async () => {
      mockDb.position.findFirst.mockResolvedValue({
        id: 4,
        title: "Staff Engineer",
      });
      mockDb.position.update.mockResolvedValue({
        id: 4,
        title: "Staff Engineer",
      });

      const caller = createCaller();
      const result = await caller.updateAccomplishments({
        accomplishments: "- Improved deployment time by 80%",
        positionId: 4,
      });

      expect(result).toEqual({
        positionId: 4,
        success: true,
        title: "Staff Engineer",
      });
      expect(mockDb.position.update).toHaveBeenCalledWith({
        data: { accomplishments: "- Improved deployment time by 80%" },
        where: { id: 4 },
      });
    });
  });

  describe("updateSummary", () => {
    test("should update the summary for an owned resume", async () => {
      mockDb.resume.findFirst.mockResolvedValue({ id: "Res001" });
      mockDb.resume.update.mockResolvedValue({ id: "Res001" });

      const caller = createCaller();
      const result = await caller.updateSummary({
        resumeId: "Res001",
        summary: "Platform engineer focused on reliable delivery.",
      });

      expect(result).toEqual({ resumeId: "Res001", success: true });
      expect(mockDb.resume.update).toHaveBeenCalledWith({
        data: { summary: "Platform engineer focused on reliable delivery." },
        where: { id: "Res001" },
      });
    });
  });

  describe("delete", () => {
    test("should delete resume", async () => {
      const existingResume = {
        contactInfoId: 1,
        createdAt: new Date(),
        id: "Res001",
        jobId: null,
        name: "Resume",
        summary: "[]",
        updatedAt: new Date(),
        userId: "user-123",
      };

      mockDb.resume.findFirst.mockResolvedValue(existingResume);
      mockDb.resume.delete.mockResolvedValue(existingResume);

      const caller = createCaller();
      const result = await caller.delete({ id: "Res001" });

      expect(result.success).toBe(true);
      expect(mockDb.resume.delete).toHaveBeenCalledWith({
        where: { id: "Res001" },
      });
    });

    test("should throw NOT_FOUND when deleting non-existent resume", async () => {
      mockDb.resume.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      await expect(caller.delete({ id: "Res999" })).rejects.toThrow(
        "Resume not found",
      );
    });
  });

  describe("duplicate", () => {
    test("should duplicate resume with all nested data", async () => {
      const originalResume = {
        contactInfo: {
          email: "john@test.com",
          id: 1,
          name: "John",
          phone: "123",
        },
        contactInfoId: 1,
        createdAt: new Date(),
        education: [
          {
            distinction: "Degree",
            endDate: new Date(),
            id: 1,
            institution: "University",
            link: "https://uni.edu",
            location: "City",
            notes: null,
            resumeId: "Res001",
            startDate: new Date(),
            type: EducationType.EDUCATION,
          },
        ],
        experience: [
          {
            companyName: "Company",
            id: 1,
            link: "https://company.com",
            positions: [
              {
                accomplishments: JSON.stringify(["Achievement"]),
                endDate: null,
                experienceId: 1,
                id: 1,
                location: "Remote",
                startDate: new Date(),
                title: "Engineer",
              },
            ],
            resumeId: "Res001",
          },
        ],
        id: 1,
        jobId: null,
        name: "Original",
        patents: [],
        sections: [],
        skills: [],
        summary: JSON.stringify(["Summary"]),
        updatedAt: new Date(),
        userId: "user-123",
      };

      const duplicatedResume = {
        ...originalResume,
        contactInfoId: 2,
        id: 2,
        name: "Original (Copy)",
      };

      mockDb.resume.findFirst.mockResolvedValue(originalResume);
      mockDb.contactInfo.create.mockResolvedValue({
        email: "john@test.com",
        id: 2,
        name: "John",
        phone: "123",
      });
      mockDb.resume.create.mockResolvedValue(duplicatedResume);

      const caller = createCaller();
      const result = await caller.duplicate({ id: "Res001" });

      expect(result.id).toBe(2);
      expect(result.name).toBe("Original (Copy)");
      expect(mockDb.resume.create).toHaveBeenCalled();
    });

    test("should use custom name when provided", async () => {
      const originalResume = {
        contactInfo: null,
        contactInfoId: null,
        createdAt: new Date(),
        education: [],
        experience: [],
        id: 1,
        jobId: null,
        name: "Original",
        patents: [],
        sections: [],
        skills: [],
        summary: "[]",
        updatedAt: new Date(),
        userId: "user-123",
      };

      const duplicatedResume = {
        ...originalResume,
        id: 2,
        name: "Custom Name",
      };

      mockDb.resume.findFirst.mockResolvedValue(originalResume);
      mockDb.resume.create.mockResolvedValue(duplicatedResume);

      const caller = createCaller();
      const result = await caller.duplicate({
        id: "Res001",
        name: "Custom Name",
      });

      expect(result.name).toBe("Custom Name");
    });

    test("should throw NOT_FOUND when duplicating non-existent resume", async () => {
      mockDb.resume.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      await expect(caller.duplicate({ id: "Res999" })).rejects.toThrow(
        "Resume not found",
      );
    });
  });
});
