import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EducationType, type PrismaClient } from "~/generated/prisma/client";
import {
  addExperience,
  addResumeSectionItem,
  createResume,
  createResumeCopy,
  createTailoredResumeFromProfile,
  deleteResume,
  deleteResumeSectionItem,
  duplicateResume,
  getResume,
  getResumeMarkdown,
  listResumes,
  removeResumeSection,
  renderResumeMarkdown,
  updateAccomplishments,
  updateResume,
  updateResumeSectionItem,
  updateResumeTitle,
  updateSkills,
  updateSummary,
} from "./resume";

const createMockDb = () => {
  const db = {
    accomplishmentProfile: {
      findUnique: vi.fn(),
    },
    contactInfo: {
      create: vi.fn(),
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
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
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
      create: vi.fn(),
      createMany: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
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
      update: vi.fn(),
    },
    resumeSkill: {
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    section: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
    },
    skill: {
      create: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  };

  return {
    ...db,
    $transaction: vi.fn(async (callback: (transaction: typeof db) => unknown) =>
      callback(db),
    ),
  };
};

type MockDb = ReturnType<typeof createMockDb>;

const userId = "user-123";
const parseTestMonth = (value: string) => new Date(`${value}-01T00:00:00.000Z`);

describe("resume lib", () => {
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe("addResumeSectionItem", () => {
    it("atomically adds a section with its first patent", async () => {
      mockDb.resume.findFirst.mockResolvedValue({ id: 10 });
      mockDb.section.findFirst.mockResolvedValue(null);
      mockDb.patent.create.mockResolvedValue({ id: 30 });

      await expect(
        addResumeSectionItem(mockDb as unknown as PrismaClient, userId, {
          date: "2021-06",
          description: "Reduced stale reads in distributed systems.",
          resumeId: 10,
          title: "Adaptive cache invalidation",
          type: "PATENTS",
        }),
      ).resolves.toMatchObject({ id: 10 });

      expect(mockDb.section.create).toHaveBeenCalledWith({
        data: {
          resumeId: 10,
          title: "Patents",
          type: "PATENTS",
        },
      });
      expect(mockDb.patent.create).toHaveBeenCalledWith({
        data: {
          date: new Date("2021-06-01T00:00:00.000Z"),
          description: "Reduced stale reads in distributed systems.",
          link: null,
          resumeId: 10,
          title: "Adaptive cache invalidation",
        },
      });
    });

    it("adds another resume-level skill without duplicating its section", async () => {
      mockDb.resume.findFirst.mockResolvedValue({ id: 10 });
      mockDb.section.findFirst.mockResolvedValue({ id: 20 });
      mockDb.resumeSkill.findFirst.mockResolvedValue(null);
      mockDb.skill.upsert.mockResolvedValue({ id: 40, name: "TypeScript" });

      await expect(
        addResumeSectionItem(mockDb as unknown as PrismaClient, userId, {
          name: "TypeScript",
          resumeId: 10,
          type: "SKILLS_SUMMARY",
        }),
      ).resolves.toMatchObject({ id: 10 });

      expect(mockDb.section.create).not.toHaveBeenCalled();
      expect(mockDb.resumeSkill.create).toHaveBeenCalledWith({
        data: {
          resumeId: 10,
          skillId: 40,
        },
      });
    });

    it("adds an experience item with its first position", async () => {
      mockDb.resume.findFirst.mockResolvedValue({ id: 10 });
      mockDb.section.findFirst.mockResolvedValue(null);
      mockDb.experience.findFirst.mockResolvedValue(null);

      await addResumeSectionItem(mockDb as unknown as PrismaClient, userId, {
        accomplishments: "- Built a resilient platform",
        companyName: "Globex",
        location: "Remote",
        resumeId: 10,
        roleTitle: "Principal Engineer",
        startDate: "2024-01",
        type: "EXPERIENCE",
      });

      expect(mockDb.experience.create).toHaveBeenCalledWith({
        data: {
          companyName: "Globex",
          positions: {
            create: {
              accomplishments: "- Built a resilient platform",
              endDate: null,
              location: "Remote",
              startDate: parseTestMonth("2024-01"),
              title: "Principal Engineer",
            },
          },
          resumeId: 10,
        },
      });
    });

    it.each([
      {
        endDate: "2020-06",
        expectedStartDate: "2016-09",
        startDate: "2016-09",
        type: "EDUCATION" as const,
      },
      {
        endDate: "2023-04",
        expectedStartDate: "2023-04",
        startDate: undefined,
        type: "CERTIFICATION" as const,
      },
    ])(
      "adds a $type item",
      async ({ endDate, expectedStartDate, startDate, type }) => {
        mockDb.resume.findFirst.mockResolvedValue({ id: 10 });
        mockDb.section.findFirst.mockResolvedValue(null);

        if (type === "EDUCATION") {
          await addResumeSectionItem(
            mockDb as unknown as PrismaClient,
            userId,
            {
              distinction: "BS Computer Science",
              endDate,
              institution: "Stanford",
              location: "Remote",
              resumeId: 10,
              startDate: startDate ?? "",
              type,
            },
          );
        } else {
          await addResumeSectionItem(
            mockDb as unknown as PrismaClient,
            userId,
            {
              distinction: "AWS Architect",
              endDate,
              institution: "AWS",
              location: "Remote",
              resumeId: 10,
              type,
            },
          );
        }

        expect(mockDb.education.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            endDate: parseTestMonth(endDate),
            startDate: parseTestMonth(expectedStartDate),
            type,
          }),
        });
      },
    );
  });

  describe("updateResumeSectionItem", () => {
    it("updates an owned patent and returns the refreshed resume", async () => {
      mockDb.resume.findFirst.mockResolvedValue({ id: 10 });
      mockDb.patent.findFirst.mockResolvedValue({ id: 30 });

      await expect(
        updateResumeSectionItem(mockDb as unknown as PrismaClient, userId, {
          date: "2024-03",
          description: "Updated patent description.",
          itemId: 30,
          link: "https://patents.example.com/30",
          resumeId: 10,
          title: "Adaptive cache invalidation v2",
          type: "PATENTS",
        }),
      ).resolves.toMatchObject({ id: 10 });

      expect(mockDb.patent.update).toHaveBeenCalledWith({
        data: {
          date: parseTestMonth("2024-03"),
          description: "Updated patent description.",
          link: "https://patents.example.com/30",
          title: "Adaptive cache invalidation v2",
        },
        where: { id: 30 },
      });
    });

    it("updates all education details", async () => {
      mockDb.resume.findFirst.mockResolvedValue({ id: 10 });
      mockDb.education.findFirst.mockResolvedValue({ id: 31 });

      await updateResumeSectionItem(mockDb as unknown as PrismaClient, userId, {
        distinction: "MSc Computer Science",
        endDate: "2022-06",
        institution: "Example University",
        itemId: 31,
        link: "https://example.edu",
        location: "Seattle, WA",
        notes: "Distributed systems",
        resumeId: 10,
        startDate: "2020-09",
        type: "EDUCATION",
      });

      expect(mockDb.education.update).toHaveBeenCalledWith({
        data: {
          distinction: "MSc Computer Science",
          endDate: parseTestMonth("2022-06"),
          institution: "Example University",
          link: "https://example.edu",
          location: "Seattle, WA",
          notes: "Distributed systems",
          startDate: parseTestMonth("2020-09"),
        },
        where: { id: 31 },
      });
    });

    it("updates an owned resume skill", async () => {
      mockDb.resume.findFirst.mockResolvedValue({ id: 10 });
      mockDb.resumeSkill.findFirst.mockResolvedValue({ id: 32 });
      mockDb.skill.upsert.mockResolvedValue({ id: 41, name: "React" });

      await updateResumeSectionItem(mockDb as unknown as PrismaClient, userId, {
        itemId: 32,
        name: "React",
        resumeId: 10,
        type: "SKILLS_SUMMARY",
      });

      expect(mockDb.resumeSkill.update).toHaveBeenCalledWith({
        data: { skillId: 41 },
        where: { id: 32 },
      });
    });
  });

  describe("deleteResumeSectionItem", () => {
    it("deletes an education item without removing its section", async () => {
      mockDb.resume.findFirst.mockResolvedValue({ id: 10 });
      mockDb.education.findFirst.mockResolvedValue({ id: 31 });

      await deleteResumeSectionItem(mockDb as unknown as PrismaClient, userId, {
        itemId: 31,
        resumeId: 10,
        type: "EDUCATION",
      });

      expect(mockDb.education.delete).toHaveBeenCalledWith({
        where: { id: 31 },
      });
      expect(mockDb.section.deleteMany).not.toHaveBeenCalled();
    });

    it("deletes a last experience position and its company safely", async () => {
      mockDb.resume.findFirst.mockResolvedValue({ id: 10 });
      mockDb.position.findFirst.mockResolvedValue({
        experience: { _count: { positions: 1 }, id: 40 },
        id: 33,
      });

      await deleteResumeSectionItem(mockDb as unknown as PrismaClient, userId, {
        itemId: 33,
        resumeId: 10,
        type: "EXPERIENCE",
      });

      expect(mockDb.positionSkill.deleteMany).toHaveBeenCalledWith({
        where: { positionId: 33 },
      });
      expect(mockDb.experience.delete).toHaveBeenCalledWith({
        where: { id: 40 },
      });
    });
  });

  describe("removeResumeSection", () => {
    it("removes the section and all of its patent items atomically", async () => {
      mockDb.resume.findFirst.mockResolvedValue({ id: 10 });

      await removeResumeSection(mockDb as unknown as PrismaClient, userId, {
        resumeId: 10,
        type: "PATENTS",
      });

      expect(mockDb.patent.deleteMany).toHaveBeenCalledWith({
        where: { resumeId: 10 },
      });
      expect(mockDb.section.deleteMany).toHaveBeenCalledWith({
        where: { resumeId: 10, type: "PATENTS" },
      });
      expect(mockDb.$transaction).toHaveBeenCalledOnce();
    });

    it("removes both resume-level and position-level skills", async () => {
      mockDb.resume.findFirst.mockResolvedValue({ id: 10 });

      await removeResumeSection(mockDb as unknown as PrismaClient, userId, {
        resumeId: 10,
        type: "SKILLS_SUMMARY",
      });

      expect(mockDb.resumeSkill.deleteMany).toHaveBeenCalledWith({
        where: { resumeId: 10 },
      });
      expect(mockDb.positionSkill.deleteMany).toHaveBeenCalledWith({
        where: { position: { experience: { resumeId: 10 } } },
      });
    });
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
          education: [],
          experience: [],
          jobId: "job-123",
          name: "Resume",
          professionalSummary: "",
        }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Job not found or does not belong to user",
      });
    });
  });

  describe("createTailoredResumeFromProfile", () => {
    it("creates a grounded tailored resume from the saved job and accomplishment profile", async () => {
      mockDb.job.findFirst.mockResolvedValue({
        company: "Acme",
        description:
          "Looking for a staff platform engineer to improve reliability, developer experience, and CI/CD systems.",
        id: "job-123",
        title: "Staff Platform Engineer",
        url: "https://example.com/jobs/platform",
        userId,
      });
      mockDb.accomplishmentProfile.findUnique.mockResolvedValue({
        id: 15,
        roles: [
          {
            companyName: "Orbit",
            endDate: null,
            entries: [
              {
                content:
                  "Led the CI/CD migration to GitHub Actions and cut deploy times from 45 minutes to 8 minutes.",
                id: 301,
                sortOrder: 0,
              },
              {
                content:
                  "Partnered with product on quarterly planning for platform investments.",
                id: 302,
                sortOrder: 1,
              },
            ],
            id: 21,
            location: "Remote",
            sortOrder: 0,
            startDate: new Date("2022-01-01T00:00:00.000Z"),
            title: "Staff Engineer",
          },
          {
            companyName: "Northwind",
            endDate: new Date("2021-12-01T00:00:00.000Z"),
            entries: [
              {
                content:
                  "Built dashboards for weekly sales reporting and stakeholder reviews.",
                id: 401,
                sortOrder: 0,
              },
            ],
            id: 22,
            location: "San Francisco, CA",
            sortOrder: 1,
            startDate: new Date("2020-01-01T00:00:00.000Z"),
            title: "Analytics Engineer",
          },
        ],
        userId,
      });
      mockDb.resume.findFirst.mockResolvedValue({
        contactInfo: {
          email: "jane@example.com",
          name: "Jane Doe",
          phone: "555-1111",
        },
        education: [
          {
            distinction: "BS Computer Science",
            endDate: new Date("2016-06-01T00:00:00.000Z"),
            institution: "State University",
            link: "https://example.edu",
            location: "Seattle, WA",
            notes: "Dean's list",
            startDate: new Date("2012-09-01T00:00:00.000Z"),
            type: EducationType.EDUCATION,
          },
        ],
        id: 77,
      });
      mockDb.resume.create.mockResolvedValue({
        id: 88,
        name: "Staff Platform Engineer Resume",
      });

      await createTailoredResumeFromProfile(
        mockDb as unknown as PrismaClient,
        userId,
        { jobId: "job-123" },
      );

      expect(mockDb.resume.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contactInfo: {
            create: {
              email: "jane@example.com",
              name: "Jane Doe",
              phone: "555-1111",
            },
          },
          education: {
            create: [
              {
                distinction: "BS Computer Science",
                endDate: new Date("2016-06-01T00:00:00.000Z"),
                institution: "State University",
                link: "https://example.edu",
                location: "Seattle, WA",
                notes: "Dean's list",
                startDate: new Date("2012-09-01T00:00:00.000Z"),
                type: EducationType.EDUCATION,
              },
            ],
          },
          Job: {
            connect: { id: "job-123" },
          },
          name: "Staff Platform Engineer Resume",
          summary: expect.stringContaining("Staff Platform Engineer"),
          user: {
            connect: { id: userId },
          },
        }),
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

      const createPayload = mockDb.resume.create.mock.calls[0]?.[0];
      expect(createPayload.data.experience.create[0]).toMatchObject({
        companyName: "Orbit",
        link: undefined,
        positions: {
          create: [
            expect.objectContaining({
              accomplishments: expect.stringContaining(
                "Led the CI/CD migration to GitHub Actions",
              ),
              endDate: null,
              location: "Remote",
              startDate: new Date("2022-01-01T00:00:00.000Z"),
              title: "Staff Engineer",
            }),
          ],
        },
      });
    });

    it("rejects generation when the accomplishment profile is empty", async () => {
      mockDb.job.findFirst.mockResolvedValue({
        id: "job-123",
        title: "Platform Engineer",
        url: "https://example.com/jobs/platform",
        userId,
      });
      mockDb.accomplishmentProfile.findUnique.mockResolvedValue({
        id: 15,
        roles: [],
        userId,
      });

      await expect(
        createTailoredResumeFromProfile(
          mockDb as unknown as PrismaClient,
          userId,
          { jobId: "job-123" },
        ),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message:
          "Add accomplishments to your profile before generating a resume",
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

  describe("listResumes", () => {
    it("orders resumes by last updated descending by default", async () => {
      mockDb.resume.findMany.mockResolvedValue([]);

      await listResumes(mockDb as unknown as PrismaClient, userId);

      expect(mockDb.resume.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            updatedAt: "desc",
          },
        }),
      );
    });

    it("orders resumes by name ascending when requested", async () => {
      mockDb.resume.findMany.mockResolvedValue([]);

      await listResumes(mockDb as unknown as PrismaClient, userId, {
        sort: "name",
      });

      expect(mockDb.resume.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            name: "asc",
          },
        }),
      );
    });

    it("orders resumes by created date descending when requested", async () => {
      mockDb.resume.findMany.mockResolvedValue([]);

      await listResumes(mockDb as unknown as PrismaClient, userId, {
        sort: "created",
      });

      expect(mockDb.resume.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            createdAt: "desc",
          },
        }),
      );
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
          patents: {
            orderBy: { date: "desc" },
          },
          sections: true,
          skills: {
            include: { skill: true },
          },
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
        patents: [
          {
            date: new Date("2021-06-01T00:00:00.000Z"),
            description: "Reduced stale reads in distributed systems.",
            link: "https://patents.example.com/cache",
            title: "Adaptive cache invalidation",
          },
        ],
        sections: [
          {
            title: "Skills Summary",
            type: "SKILLS_SUMMARY",
          },
        ],
        skills: [{ skill: { name: "React" } }],
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
      expect(markdown).toContain("Prisma ORM, React, TypeScript");
      expect(markdown).toContain("## Patents");
      expect(markdown).toContain(
        "### [Adaptive cache invalidation](https://patents.example.com/cache)",
      );
      expect(markdown).toContain("Reduced stale reads in distributed systems.");
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
        patents: [],
        sections: [],
        skills: [],
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
          patents: {
            orderBy: { date: "desc" },
          },
          sections: true,
          skills: {
            include: { skill: true },
          },
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
        patents: [
          {
            date: new Date("2021-06-01T00:00:00.000Z"),
            description: "Distributed cache patent",
            link: null,
            title: "Adaptive cache invalidation",
          },
        ],
        sections: [{ title: "Patents", type: "PATENTS" }],
        skills: [{ skillId: 55 }],
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
          patents: true,
          sections: true,
          skills: true,
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
          patents: {
            create: [
              {
                date: new Date("2021-06-01T00:00:00.000Z"),
                description: "Distributed cache patent",
                link: null,
                title: "Adaptive cache invalidation",
              },
            ],
          },
          sections: {
            create: [{ title: "Patents", type: "PATENTS" }],
          },
          skills: {
            create: [{ skill: { connect: { id: 55 } } }],
          },
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
          patents: true,
          sections: true,
          skills: {
            include: { skill: true },
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
        patents: [],
        sections: [
          {
            title: "Experience",
            type: "EXPERIENCE",
          },
        ],
        skills: [],
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
          patents: true,
          sections: true,
          skills: true,
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
          patents: {
            create: [],
          },
          sections: {
            create: [
              {
                title: "Experience",
                type: "EXPERIENCE",
              },
            ],
          },
          skills: {
            create: [],
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
        patents: [],
        sections: [],
        skills: [],
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
          patents: {
            create: [],
          },
          sections: {
            create: [],
          },
          skills: {
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
        patents: [],
        sections: [],
        skills: [],
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
          patents: {
            create: [],
          },
          sections: {
            create: [],
          },
          skills: {
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
    it("rejects accomplishments updates for unowned positions", async () => {
      mockDb.position.findFirst.mockResolvedValue(null);

      await expect(
        updateAccomplishments(mockDb as unknown as PrismaClient, userId, {
          accomplishments: "- Improved conversion",
          positionId: 4,
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Position not found",
      });

      expect(mockDb.position.update).not.toHaveBeenCalled();
    });

    it("updates accomplishments", async () => {
      mockDb.position.findFirst.mockResolvedValue({
        id: 4,
        title: "Staff Engineer",
      });
      mockDb.position.update.mockResolvedValue({
        id: 4,
        title: "Staff Engineer",
      });

      await expect(
        updateAccomplishments(mockDb as unknown as PrismaClient, userId, {
          accomplishments: "- Improved conversion",
          positionId: 4,
        }),
      ).resolves.toEqual({
        positionId: 4,
        success: true,
        title: "Staff Engineer",
      });
    });

    it("rejects summary updates for unowned resumes", async () => {
      mockDb.resume.findFirst.mockResolvedValue(null);

      await expect(
        updateSummary(mockDb as unknown as PrismaClient, userId, {
          resumeId: 10,
          summary: "New summary",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Resume not found",
      });

      expect(mockDb.resume.update).not.toHaveBeenCalled();
    });

    it("updates summary", async () => {
      mockDb.resume.findFirst.mockResolvedValue({ id: 10 });
      mockDb.resume.update.mockResolvedValue({ id: 10 });

      await expect(
        updateSummary(mockDb as unknown as PrismaClient, userId, {
          resumeId: 10,
          summary: "New summary",
        }),
      ).resolves.toEqual({
        resumeId: 10,
        success: true,
      });
    });

    it("rejects experience creation for unowned resumes", async () => {
      mockDb.resume.findFirst.mockResolvedValue(null);

      await expect(
        addExperience(mockDb as unknown as PrismaClient, userId, {
          accomplishments: "- Launched AI search",
          companyName: "Tech Corp",
          endDate: "2024-01-01",
          location: "Remote",
          resumeId: 10,
          startDate: "2023-01-01",
          title: "Principal Engineer",
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Resume not found",
      });

      expect(mockDb.position.create).not.toHaveBeenCalled();
      expect(mockDb.experience.create).not.toHaveBeenCalled();
    });

    it("adds a position to an existing company experience", async () => {
      mockDb.resume.findFirst.mockResolvedValue({
        experience: [{ companyName: "Tech Corp", id: 8 }],
        id: 10,
      });

      await expect(
        addExperience(mockDb as unknown as PrismaClient, userId, {
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
      mockDb.resume.findFirst.mockResolvedValue({
        experience: [],
        id: 10,
      });

      await addExperience(mockDb as unknown as PrismaClient, userId, {
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

    it("rejects skill replacement for unowned positions", async () => {
      mockDb.position.findFirst.mockResolvedValue(null);

      await expect(
        updateSkills(mockDb as unknown as PrismaClient, userId, {
          positionId: 9,
          skills: ["TypeScript", "Prisma ORM"],
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Position not found",
      });

      expect(mockDb.positionSkill.deleteMany).not.toHaveBeenCalled();
    });

    it("replaces position skills and creates missing skills", async () => {
      mockDb.position.findFirst.mockResolvedValue({
        id: 9,
        title: "Principal Engineer",
      });
      mockDb.skill.findUnique
        .mockResolvedValueOnce({ id: 1, name: "TypeScript" })
        .mockResolvedValueOnce(null);
      mockDb.skill.create.mockResolvedValue({ id: 2, name: "Prisma ORM" });

      await expect(
        updateSkills(mockDb as unknown as PrismaClient, userId, {
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
