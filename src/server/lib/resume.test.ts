import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EducationType, type PrismaClient } from "~/generated/prisma/client";
import {
  addExperience,
  createResume,
  createResumeCopy,
  deleteResume,
  duplicateResume,
  getResume,
  getResumeMarkdown,
  listResumes,
  renderResumeMarkdown,
  updateAccomplishments,
  updateResume,
  updateResumeTitle,
  updateSkills,
  updateSummary,
} from "./resume";

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
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
  },
  positionSkill: {
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  resume: {
    create: vi.fn(),
    delete: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  skill: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
});

type MockDb = ReturnType<typeof createMockDb>;

const userId = "user-123";

describe("resume lib", () => {
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe("createResume", () => {
    it("creates a resume with markdown fields and nested relations", async () => {
      mockDb.job.findFirst.mockResolvedValue({ id: "job-123", userId });
      mockDb.contactInfo.create.mockResolvedValue({
        id: 7,
      });
      mockDb.resume.create.mockResolvedValue({
        id: 10,
        summary: "Professional summary",
      });

      await createResume(mockDb as unknown as PrismaClient, userId, {
        contactInfo: {
          email: "john@example.com",
          name: "John Doe",
          phone: "123-456-7890",
        },
        education: [
          {
            distinction: "BS Computer Science",
            endDate: new Date("2014-06-01T00:00:00.000Z"),
            institution: "Stanford",
            link: "https://stanford.edu",
            location: "Stanford, CA",
            startDate: new Date("2010-09-01T00:00:00.000Z"),
            type: EducationType.EDUCATION,
          },
        ],
        experience: [
          {
            companyName: "Tech Corp",
            link: "https://techcorp.com",
            positions: [
              {
                accomplishments: "- Led team\n- Improved latency",
                endDate: new Date("2024-01-01T00:00:00.000Z"),
                location: "Remote",
                startDate: new Date("2020-01-01T00:00:00.000Z"),
                title: "Staff Engineer",
              },
            ],
          },
        ],
        jobId: "job-123",
        name: "Core Resume",
        professionalSummary: "Professional summary",
      });

      expect(mockDb.job.findFirst).toHaveBeenCalledWith({
        where: {
          id: "job-123",
          userId,
        },
      });
      expect(mockDb.contactInfo.create).toHaveBeenCalledWith({
        data: {
          email: "john@example.com",
          name: "John Doe",
          phone: "123-456-7890",
        },
      });
      expect(mockDb.resume.create).toHaveBeenCalledWith({
        data: {
          contactInfoId: 7,
          education: {
            create: [
              {
                distinction: "BS Computer Science",
                endDate: new Date("2014-06-01T00:00:00.000Z"),
                institution: "Stanford",
                link: "https://stanford.edu",
                location: "Stanford, CA",
                notes: undefined,
                startDate: new Date("2010-09-01T00:00:00.000Z"),
                type: EducationType.EDUCATION,
              },
            ],
          },
          experience: {
            create: [
              {
                companyName: "Tech Corp",
                link: "https://techcorp.com",
                positions: {
                  create: [
                    {
                      accomplishments: "- Led team\n- Improved latency",
                      endDate: new Date("2024-01-01T00:00:00.000Z"),
                      location: "Remote",
                      startDate: new Date("2020-01-01T00:00:00.000Z"),
                      title: "Staff Engineer",
                    },
                  ],
                },
              },
            ],
          },
          jobId: "job-123",
          name: "Core Resume",
          summary: "Professional summary",
          userId,
        },
        include: {
          contactInfo: true,
          education: true,
          experience: {
            include: {
              positions: true,
            },
          },
        },
      });
    });

    it("rejects a job that does not belong to the user", async () => {
      mockDb.job.findFirst.mockResolvedValue(null);

      await expect(
        createResume(mockDb as unknown as PrismaClient, userId, {
          jobId: "job-123",
          name: "Resume",
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Job not found or does not belong to user",
      });
    });
  });

  describe("deleteResume", () => {
    it("deletes an owned resume", async () => {
      mockDb.resume.findFirst.mockResolvedValue({ id: 10, userId });

      await expect(
        deleteResume(mockDb as unknown as PrismaClient, userId, { id: 10 }),
      ).resolves.toEqual({ success: true });

      expect(mockDb.resume.delete).toHaveBeenCalledWith({
        where: { id: 10 },
      });
    });

    it("throws when the resume is not owned by the user", async () => {
      mockDb.resume.findFirst.mockResolvedValue(null);

      await expect(
        deleteResume(mockDb as unknown as PrismaClient, userId, { id: 10 }),
      ).rejects.toBeInstanceOf(TRPCError);
    });
  });

  describe("getResume", () => {
    it("returns the owned resume with relations", async () => {
      const resume = { id: 10, name: "Resume", userId };
      mockDb.resume.findFirst.mockResolvedValue(resume);

      await expect(
        getResume(mockDb as unknown as PrismaClient, userId, { id: 10 }),
      ).resolves.toBe(resume);

      expect(mockDb.resume.findFirst).toHaveBeenCalledWith({
        include: {
          contactInfo: true,
          education: true,
          experience: {
            include: {
              positions: {
                include: {
                  skillPosition: {
                    include: {
                      skill: true,
                    },
                  },
                },
                orderBy: {
                  startDate: "desc",
                },
              },
            },
          },
          Job: true,
          sections: true,
        },
        where: {
          id: 10,
          userId,
        },
      });
    });

    it("throws when the resume does not exist", async () => {
      mockDb.resume.findFirst.mockResolvedValue(null);

      await expect(
        getResume(mockDb as unknown as PrismaClient, userId, { id: 999 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Resume not found",
      });
    });
  });

  describe("resume markdown", () => {
    it("renders resume content as plain markdown", () => {
      const markdown = renderResumeMarkdown({
        contactInfo: {
          email: "jane@example.com",
          name: "Jane Doe",
          phone: "555-1111",
        },
        education: [
          {
            distinction: "BS Computer Science",
            endDate: new Date("2014-06-01T00:00:00.000Z"),
            institution: "Stanford University",
            link: "https://stanford.edu",
            location: "Stanford, CA",
            notes: "Graduated with distinction",
            startDate: new Date("2010-09-01T00:00:00.000Z"),
            type: EducationType.EDUCATION,
          },
          {
            distinction: "AWS Certified Solutions Architect",
            endDate: new Date("2024-01-01T00:00:00.000Z"),
            institution: "Amazon Web Services",
            link: "https://aws.amazon.com/certification/",
            location: "Remote",
            notes: "Professional level",
            startDate: new Date("2024-01-01T00:00:00.000Z"),
            type: EducationType.CERTIFICATION,
          },
        ],
        experience: [
          {
            companyName: "Tech Corp",
            link: "https://techcorp.example.com",
            positions: [
              {
                accomplishments:
                  "- Led platform rewrite\n- Reduced latency by 40%",
                endDate: null,
                location: "Remote",
                skillPosition: [
                  { skill: { name: "Prisma ORM" } },
                  { skill: { name: "TypeScript" } },
                ],
                startDate: new Date("2022-01-01T00:00:00.000Z"),
                title: "Staff Engineer",
              },
            ],
          },
        ],
        Job: {
          company: "Tech Corp",
          title: "Principal Engineer",
        },
        name: "Jane Resume",
        sections: [
          {
            title: "Skills Summary",
            type: "SKILLS_SUMMARY",
          },
        ],
        summary: "Builder of pragmatic developer platforms.",
      } as Awaited<ReturnType<typeof getResume>>);

      expect(markdown).toContain("# Jane Doe");
      expect(markdown).toContain("jane@example.com | 555-1111");
      expect(markdown).toContain("Target role: Principal Engineer");
      expect(markdown).toContain("## Summary");
      expect(markdown).toContain("Builder of pragmatic developer platforms.");
      expect(markdown).toContain("## Experience");
      expect(markdown).toContain(
        "### [Tech Corp](https://techcorp.example.com)",
      );
      expect(markdown).toContain("**Staff Engineer**");
      expect(markdown).toContain("Remote | Jan 2022 - Present");
      expect(markdown).toContain("- Led platform rewrite");
      expect(markdown).toContain("## Education");
      expect(markdown).toContain("## Certifications");
      expect(markdown).toContain("## Skills");
      expect(markdown).toContain("Prisma ORM, TypeScript");
      expect(markdown.endsWith("\n")).toBe(true);
      expect(markdown).not.toContain("<div");
    });

    it("fetches the owned resume and returns markdown", async () => {
      mockDb.resume.findFirst.mockResolvedValue({
        contactInfo: {
          email: "jane@example.com",
          name: "Jane Doe",
          phone: "555-1111",
        },
        education: [],
        experience: [],
        id: 22,
        Job: null,
        sections: [],
        summary: "Summary",
        userId,
      });

      const markdown = await getResumeMarkdown(
        mockDb as unknown as PrismaClient,
        userId,
        { id: 22 },
      );

      expect(markdown).toContain("# Jane Doe");
      expect(mockDb.resume.findFirst).toHaveBeenCalledWith({
        include: {
          contactInfo: true,
          education: true,
          experience: {
            include: {
              positions: {
                include: {
                  skillPosition: {
                    include: {
                      skill: true,
                    },
                  },
                },
                orderBy: {
                  startDate: "desc",
                },
              },
            },
          },
          Job: true,
          sections: true,
        },
        where: {
          id: 22,
          userId,
        },
      });
    });
  });

  describe("listResumes", () => {
    it("returns only persisted resumes ordered by updated date", async () => {
      const resumes = [
        { id: 2, name: "Resume B" },
        { id: 1, name: "Resume A" },
      ];
      mockDb.resume.findMany.mockResolvedValue(resumes);

      await expect(
        listResumes(mockDb as unknown as PrismaClient, userId),
      ).resolves.toEqual(resumes);

      expect(mockDb.resume.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: {
              education: true,
              experience: true,
            },
          },
          contactInfo: true,
          Job: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        where: {
          userId,
        },
      });
    });

    it("filters persisted resumes by jobId", async () => {
      mockDb.resume.findMany.mockResolvedValue([]);

      await listResumes(mockDb as unknown as PrismaClient, userId, {
        jobId: "job-123",
      });

      expect(mockDb.resume.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: {
              education: true,
              experience: true,
            },
          },
          contactInfo: true,
          Job: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        where: {
          jobId: "job-123",
          userId,
        },
      });
    });
  });

  describe("updateResume", () => {
    it("updates contact info, experience, education, and summary", async () => {
      mockDb.resume.findFirst.mockResolvedValue({
        contactInfoId: 3,
        id: 10,
        userId,
      });
      mockDb.experience.findMany.mockResolvedValue([{ id: 55 }]);
      mockDb.resume.update.mockResolvedValue({
        id: 10,
        summary: "Updated summary",
      });

      await updateResume(mockDb as unknown as PrismaClient, userId, {
        contactInfo: {
          email: "updated@example.com",
          name: "Updated User",
          phone: "555-0000",
        },
        education: [
          {
            distinction: "Certificate",
            endDate: new Date("2022-01-01T00:00:00.000Z"),
            institution: "Berkeley",
            link: "https://berkeley.edu",
            location: "Berkeley, CA",
            notes: "Leadership",
            startDate: new Date("2021-01-01T00:00:00.000Z"),
            type: EducationType.CERTIFICATION,
          },
        ],
        experience: [
          {
            companyName: "Updated Corp",
            link: "https://updated.example.com",
            positions: [
              {
                accomplishments: "- Shipped platform rewrite",
                location: "Remote",
                startDate: new Date("2023-01-01T00:00:00.000Z"),
                title: "Director",
              },
            ],
          },
        ],
        id: 10,
        name: "Updated Resume",
        professionalSummary: "Updated summary",
      });

      expect(mockDb.contactInfo.update).toHaveBeenCalledWith({
        data: {
          email: "updated@example.com",
          name: "Updated User",
          phone: "555-0000",
        },
        where: { id: 3 },
      });
      expect(mockDb.experience.deleteMany).toHaveBeenCalledWith({
        where: { resumeId: 10 },
      });
      expect(mockDb.experience.createMany).toHaveBeenCalledWith({
        data: [
          {
            companyName: "Updated Corp",
            link: "https://updated.example.com",
            resumeId: 10,
          },
        ],
      });
      expect(mockDb.position.createMany).toHaveBeenCalledWith({
        data: [
          {
            accomplishments: "- Shipped platform rewrite",
            endDate: undefined,
            experienceId: 55,
            location: "Remote",
            startDate: new Date("2023-01-01T00:00:00.000Z"),
            title: "Director",
          },
        ],
      });
      expect(mockDb.education.createMany).toHaveBeenCalledWith({
        data: [
          {
            distinction: "Certificate",
            endDate: new Date("2022-01-01T00:00:00.000Z"),
            institution: "Berkeley",
            link: "https://berkeley.edu",
            location: "Berkeley, CA",
            notes: "Leadership",
            resumeId: 10,
            startDate: new Date("2021-01-01T00:00:00.000Z"),
            type: EducationType.CERTIFICATION,
          },
        ],
      });
      expect(mockDb.resume.update).toHaveBeenCalledWith({
        data: {
          name: "Updated Resume",
          summary: "Updated summary",
        },
        include: {
          contactInfo: true,
          education: true,
          experience: {
            include: {
              positions: true,
            },
          },
        },
        where: { id: 10 },
      });
    });
  });

  describe("updateResumeTitle", () => {
    it("updates only the owned resume title", async () => {
      mockDb.resume.findFirst.mockResolvedValue({
        id: 10,
        userId,
      });
      mockDb.resume.update.mockResolvedValue({
        id: 10,
        name: "Updated Resume",
      });

      await expect(
        updateResumeTitle(mockDb as unknown as PrismaClient, userId, {
          id: 10,
          name: "Updated Resume",
        }),
      ).resolves.toEqual({
        id: 10,
        name: "Updated Resume",
      });

      expect(mockDb.resume.update).toHaveBeenCalledWith({
        data: {
          name: "Updated Resume",
        },
        where: {
          id: 10,
        },
      });
      expect(mockDb.contactInfo.update).not.toHaveBeenCalled();
      expect(mockDb.experience.deleteMany).not.toHaveBeenCalled();
      expect(mockDb.education.deleteMany).not.toHaveBeenCalled();
    });

    it("throws when the resume does not exist", async () => {
      mockDb.resume.findFirst.mockResolvedValue(null);

      await expect(
        updateResumeTitle(mockDb as unknown as PrismaClient, userId, {
          id: 10,
          name: "Updated Resume",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Resume not found",
      });
    });
  });

  describe("duplicateResume", () => {
    it("duplicates a persisted resume and its nested relations", async () => {
      mockDb.job.findFirst.mockResolvedValue({ id: "job-123", userId });
      mockDb.resume.findFirst.mockResolvedValue({
        contactInfo: {
          email: "john@example.com",
          name: "John Doe",
          phone: "123-456-7890",
        },
        education: [
          {
            distinction: "BS Computer Science",
            endDate: new Date("2014-06-01T00:00:00.000Z"),
            institution: "Stanford",
            link: "https://stanford.edu",
            location: "Stanford, CA",
            notes: null,
            startDate: new Date("2010-09-01T00:00:00.000Z"),
            type: EducationType.EDUCATION,
          },
        ],
        experience: [
          {
            companyName: "Tech Corp",
            link: "https://techcorp.com",
            positions: [
              {
                accomplishments: "- Led team",
                endDate: null,
                location: "Remote",
                startDate: new Date("2020-01-01T00:00:00.000Z"),
                title: "Staff Engineer",
              },
            ],
          },
        ],
        name: "Base Resume",
        summary: "Strong summary",
      });
      mockDb.resume.create.mockResolvedValue({ id: 20, name: "Custom Copy" });

      await expect(
        duplicateResume(mockDb as unknown as PrismaClient, userId, {
          id: 10,
          jobId: "job-123",
          name: "Custom Copy",
        }),
      ).resolves.toEqual({ id: 20, name: "Custom Copy" });

      expect(mockDb.resume.findFirst).toHaveBeenCalledWith({
        include: {
          contactInfo: true,
          education: true,
          experience: {
            include: {
              positions: true,
            },
          },
        },
        where: {
          id: 10,
          userId,
        },
      });
      expect(mockDb.resume.create).toHaveBeenCalledWith({
        data: {
          contactInfo: {
            create: {
              email: "john@example.com",
              name: "John Doe",
              phone: "123-456-7890",
            },
          },
          education: {
            create: [
              {
                distinction: "BS Computer Science",
                endDate: new Date("2014-06-01T00:00:00.000Z"),
                institution: "Stanford",
                link: "https://stanford.edu",
                location: "Stanford, CA",
                notes: null,
                startDate: new Date("2010-09-01T00:00:00.000Z"),
                type: EducationType.EDUCATION,
              },
            ],
          },
          experience: {
            create: [
              {
                companyName: "Tech Corp",
                link: "https://techcorp.com",
                positions: {
                  create: [
                    {
                      accomplishments: "- Led team",
                      endDate: null,
                      location: "Remote",
                      startDate: new Date("2020-01-01T00:00:00.000Z"),
                      title: "Staff Engineer",
                    },
                  ],
                },
              },
            ],
          },
          Job: {
            connect: {
              id: "job-123",
            },
          },
          name: "Custom Copy",
          summary: "Strong summary",
          user: {
            connect: { id: userId },
          },
        },
        include: {
          contactInfo: true,
          education: true,
          experience: {
            include: {
              positions: true,
            },
          },
        },
      });
    });

    it("throws when trying to duplicate a missing resume", async () => {
      mockDb.resume.findFirst.mockResolvedValue(null);

      await expect(
        duplicateResume(mockDb as unknown as PrismaClient, userId, { id: 10 }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Resume not found",
      });
    });
  });

  describe("createResumeCopy", () => {
    it("creates a working copy from a persisted resume", async () => {
      mockDb.resume.findFirst.mockResolvedValue({
        contactInfo: {
          email: "john@example.com",
          name: "John Doe",
          phone: "123-456-7890",
        },
        education: [
          {
            distinction: "BS Computer Science",
            endDate: new Date("2014-06-01T00:00:00.000Z"),
            institution: "Stanford",
            link: "https://stanford.edu",
            location: "Stanford, CA",
            notes: null,
            startDate: new Date("2010-09-01T00:00:00.000Z"),
            type: EducationType.EDUCATION,
          },
        ],
        experience: [
          {
            companyName: "Tech Corp",
            link: "https://techcorp.com",
            positions: [
              {
                accomplishments: "- Led team",
                endDate: null,
                location: "Remote",
                startDate: new Date("2020-01-01T00:00:00.000Z"),
                title: "Staff Engineer",
              },
            ],
          },
        ],
        name: "Base Resume",
        sections: [
          {
            title: "Experience",
            type: "EXPERIENCE",
          },
        ],
        summary: "Strong summary",
      });
      mockDb.resume.create.mockResolvedValue({
        id: 44,
        name: "Base Resume - Copy 123",
      });
      const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(123);

      await expect(
        createResumeCopy(mockDb as unknown as PrismaClient, userId, {
          sourceResumeId: 10,
        }),
      ).resolves.toEqual({
        name: "Base Resume - Copy 123",
        resumeId: 44,
        success: true,
      });

      expect(mockDb.resume.findFirst).toHaveBeenCalledWith({
        include: {
          contactInfo: true,
          education: true,
          experience: {
            include: {
              positions: {
                include: {
                  skillPosition: {
                    include: {
                      skill: true,
                    },
                  },
                },
              },
            },
          },
          sections: true,
        },
        where: {
          id: 10,
          userId,
        },
      });
      expect(mockDb.resume.create).toHaveBeenCalledWith({
        data: {
          contactInfo: {
            create: {
              email: "john@example.com",
              name: "John Doe",
              phone: "123-456-7890",
            },
          },
          education: {
            create: [
              {
                distinction: "BS Computer Science",
                endDate: new Date("2014-06-01T00:00:00.000Z"),
                institution: "Stanford",
                link: "https://stanford.edu",
                location: "Stanford, CA",
                notes: null,
                startDate: new Date("2010-09-01T00:00:00.000Z"),
                type: EducationType.EDUCATION,
              },
            ],
          },
          experience: {
            create: [
              {
                companyName: "Tech Corp",
                link: "https://techcorp.com",
                positions: {
                  create: [
                    {
                      accomplishments: "- Led team",
                      endDate: null,
                      location: "Remote",
                      startDate: new Date("2020-01-01T00:00:00.000Z"),
                      title: "Staff Engineer",
                    },
                  ],
                },
              },
            ],
          },
          name: "Base Resume - Copy 123",
          sections: {
            create: [
              {
                title: "Experience",
                type: "EXPERIENCE",
              },
            ],
          },
          summary: "Strong summary",
          user: {
            connect: { id: userId },
          },
        },
      });

      dateNowSpy.mockRestore();
    });

    it("uses the provided resume name for the clone", async () => {
      mockDb.resume.findFirst.mockResolvedValue({
        contactInfo: null,
        education: [],
        experience: [],
        jobId: null,
        name: "Base Resume",
        sections: [],
        summary: "Strong summary",
      });
      mockDb.resume.create.mockResolvedValue({
        id: 46,
        name: "Custom Resume Name",
      });

      await expect(
        createResumeCopy(mockDb as unknown as PrismaClient, userId, {
          name: "Custom Resume Name",
          sourceResumeId: 12,
        }),
      ).resolves.toEqual({
        name: "Custom Resume Name",
        resumeId: 46,
        success: true,
      });

      expect(mockDb.resume.create).toHaveBeenCalledWith({
        data: {
          education: {
            create: [],
          },
          experience: {
            create: [],
          },
          name: "Custom Resume Name",
          sections: {
            create: [],
          },
          summary: "Strong summary",
          user: {
            connect: { id: userId },
          },
        },
      });
    });

    it("preserves a linked job via relation connect", async () => {
      mockDb.resume.findFirst.mockResolvedValue({
        contactInfo: null,
        education: [],
        experience: [],
        jobId: "job-123",
        name: "Job Resume",
        sections: [],
        summary: "Summary",
      });
      mockDb.resume.create.mockResolvedValue({
        id: 45,
        name: "Job Resume - Copy 456",
      });
      const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(456);

      await createResumeCopy(mockDb as unknown as PrismaClient, userId, {
        sourceResumeId: 11,
      });

      expect(mockDb.resume.create).toHaveBeenCalledWith({
        data: {
          education: {
            create: [],
          },
          experience: {
            create: [],
          },
          Job: {
            connect: { id: "job-123" },
          },
          name: "Job Resume - Copy 456",
          sections: {
            create: [],
          },
          summary: "Summary",
          user: {
            connect: { id: userId },
          },
        },
      });

      dateNowSpy.mockRestore();
    });

    it("throws when the source resume is missing", async () => {
      mockDb.resume.findFirst.mockResolvedValue(null);

      await expect(
        createResumeCopy(mockDb as unknown as PrismaClient, userId, {
          sourceResumeId: 10,
        }),
      ).rejects.toThrow("Source resume not found");
    });
  });

  describe("agent helpers", () => {
    it("updates accomplishments", async () => {
      mockDb.position.update.mockResolvedValue({
        id: 4,
        title: "Staff Engineer",
      });

      await expect(
        updateAccomplishments(mockDb as unknown as PrismaClient, {
          accomplishments: "- Improved conversion",
          positionId: 4,
        }),
      ).resolves.toEqual({
        positionId: 4,
        success: true,
        title: "Staff Engineer",
      });
    });

    it("updates summary", async () => {
      mockDb.resume.update.mockResolvedValue({ id: 10 });

      await expect(
        updateSummary(mockDb as unknown as PrismaClient, {
          resumeId: 10,
          summary: "New summary",
        }),
      ).resolves.toEqual({
        resumeId: 10,
        success: true,
      });
    });

    it("adds a position to an existing company experience", async () => {
      mockDb.resume.findUnique.mockResolvedValue({
        experience: [{ companyName: "Tech Corp", id: 8 }],
        id: 10,
      });

      await expect(
        addExperience(mockDb as unknown as PrismaClient, {
          accomplishments: "- Launched AI search",
          companyName: "Tech Corp",
          endDate: "2024-01-01",
          location: "Remote",
          resumeId: 10,
          startDate: "2023-01-01",
          title: "Principal Engineer",
        }),
      ).resolves.toEqual({
        message: "Added Principal Engineer at Tech Corp",
        success: true,
      });

      expect(mockDb.position.create).toHaveBeenCalledWith({
        data: {
          accomplishments: "- Launched AI search",
          endDate: new Date("2024-01-01"),
          experienceId: 8,
          location: "Remote",
          startDate: new Date("2023-01-01"),
          title: "Principal Engineer",
        },
      });
    });

    it("creates a new experience when the company is not present", async () => {
      mockDb.resume.findUnique.mockResolvedValue({
        experience: [],
        id: 10,
      });

      await addExperience(mockDb as unknown as PrismaClient, {
        accomplishments: "- Built platform",
        companyName: "New Corp",
        location: "Remote",
        resumeId: 10,
        startDate: "2023-01-01",
        title: "Director",
      });

      expect(mockDb.experience.create).toHaveBeenCalledWith({
        data: {
          companyName: "New Corp",
          link: null,
          positions: {
            create: {
              accomplishments: "- Built platform",
              endDate: null,
              location: "Remote",
              startDate: new Date("2023-01-01"),
              title: "Director",
            },
          },
          resumeId: 10,
        },
      });
    });

    it("replaces position skills and creates missing skills", async () => {
      mockDb.skill.findUnique
        .mockResolvedValueOnce({ id: 1, name: "TypeScript" })
        .mockResolvedValueOnce(null);
      mockDb.skill.create.mockResolvedValue({ id: 2, name: "Prisma ORM" });

      await expect(
        updateSkills(mockDb as unknown as PrismaClient, {
          positionId: 9,
          skills: ["TypeScript", "Prisma ORM"],
        }),
      ).resolves.toEqual({
        positionId: 9,
        skills: ["TypeScript", "Prisma ORM"],
        success: true,
      });

      expect(mockDb.positionSkill.deleteMany).toHaveBeenCalledWith({
        where: { positionId: 9 },
      });
      expect(mockDb.positionSkill.create).toHaveBeenNthCalledWith(1, {
        data: {
          positionId: 9,
          skillId: 1,
        },
      });
      expect(mockDb.positionSkill.create).toHaveBeenNthCalledWith(2, {
        data: {
          positionId: 9,
          skillId: 2,
        },
      });
    });
  });
});
