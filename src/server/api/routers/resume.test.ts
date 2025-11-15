import type { Session } from "next-auth";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { EducationType } from "~/generated/prisma/client";
import { resumeRouter } from "./resume";

// Mock database with proper vi.fn() for all methods
const createMockDb = () => ({
  contactInfo: {
    create: vi.fn(),
    update: vi.fn(),
  },
  education: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
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
  position: {
    createMany: vi.fn(),
  },
  resume: {
    create: vi.fn(),
    delete: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
});

let mockDb: ReturnType<typeof createMockDb>;

// Mock session
const mockSession: Session = {
  expires: new Date(Date.now() + 86400000).toISOString(),
  user: {
    email: "test@example.com",
    id: "user-123",
    name: "Test User",
  },
};

// Create caller helper
const createCaller = () => {
  const ctx = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db: mockDb as any,
    headers: new Headers(),
    session: mockSession,
  };

  return resumeRouter.createCaller(ctx);
};

describe("Resume Router", () => {
  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe("create", () => {
    test("should create a resume with all fields", async () => {
      const mockContactInfo = {
        email: "john@example.com",
        id: 1,
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
            resumeId: 1,
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
            resumeId: 1,
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
                accomplishments: ["Led team", "Improved performance"],
                endDate: new Date("2023-12-31"),
                location: "San Francisco, CA",
                startDate: new Date("2020-01-01"),
                title: "Senior Engineer",
              },
            ],
          },
        ],
        name: "My Resume",
        professionalSummary: ["Summary line 1", "Summary line 2"],
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
            resumeId: 1,
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
      const result = await caller.getById({ id: 1 });

      expect(result.summary).toEqual(["Summary 1", "Summary 2"]);
      expect(result.experience[0]?.positions[0]?.accomplishments).toEqual([
        "Achievement 1",
        "Achievement 2",
      ]);
      expect(mockDb.resume.findFirst).toHaveBeenCalledWith({
        include: expect.any(Object),
        where: { id: 1, userId: "user-123" },
      });
    });

    test("should throw NOT_FOUND when resume does not exist", async () => {
      mockDb.resume.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      await expect(caller.getById({ id: 999 })).rejects.toThrow(
        "Resume not found",
      );
    });

    test("should not return resume from different user", async () => {
      mockDb.resume.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      await expect(caller.getById({ id: 1 })).rejects.toThrow(
        "Resume not found",
      );
      expect(mockDb.resume.findFirst).toHaveBeenCalledWith({
        include: expect.any(Object),
        where: { id: 1, userId: "user-123" },
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

      // Should return 2 DB resumes + 2 mock resumes
      expect(result.length).toBeGreaterThanOrEqual(4);
      
      // First two should be the DB resumes (ordered by updatedAt desc)
      const dbResumes = result.filter((r) => r.id > 0);
      expect(dbResumes).toHaveLength(2);
      expect(dbResumes[0]?.summary).toEqual(["Summary"]);
      expect(dbResumes[1]?.summary).toEqual([]);
      
      // Should also have mock resumes with negative IDs
      const mockTemplateResumes = result.filter((r) => r.id < 0);
      expect(mockTemplateResumes.length).toBeGreaterThan(0);
      
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
        id: 1,
        name: "New Name",
        professionalSummary: ["New summary"],
      });

      expect(result.name).toBe("New Name");
      expect(result.summary).toEqual(["New summary"]);
    });

    test("should throw NOT_FOUND when updating non-existent resume", async () => {
      mockDb.resume.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      await expect(caller.update({ id: 999, name: "Test" })).rejects.toThrow(
        "Resume not found",
      );
    });

    test("should update contact info if provided", async () => {
      const existingResume = {
        contactInfoId: 1,
        createdAt: new Date(),
        id: 1,
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
        id: 1,
      });

      expect(mockDb.contactInfo.update).toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    test("should delete resume", async () => {
      const existingResume = {
        contactInfoId: 1,
        createdAt: new Date(),
        id: 1,
        jobId: null,
        name: "Resume",
        summary: "[]",
        updatedAt: new Date(),
        userId: "user-123",
      };

      mockDb.resume.findFirst.mockResolvedValue(existingResume);
      mockDb.resume.delete.mockResolvedValue(existingResume);

      const caller = createCaller();
      const result = await caller.delete({ id: 1 });

      expect(result.success).toBe(true);
      expect(mockDb.resume.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    test("should throw NOT_FOUND when deleting non-existent resume", async () => {
      mockDb.resume.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      await expect(caller.delete({ id: 999 })).rejects.toThrow(
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
            resumeId: 1,
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
            resumeId: 1,
          },
        ],
        id: 1,
        jobId: null,
        name: "Original",
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
      const result = await caller.duplicate({ id: 1 });

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
      const result = await caller.duplicate({ id: 1, name: "Custom Name" });

      expect(result.name).toBe("Custom Name");
    });

    test("should throw NOT_FOUND when duplicating non-existent resume", async () => {
      mockDb.resume.findFirst.mockResolvedValue(null);

      const caller = createCaller();

      await expect(caller.duplicate({ id: 999 })).rejects.toThrow(
        "Resume not found",
      );
    });
  });
});
