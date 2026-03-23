import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "~/generated/prisma/client";
import { createResume, getResume, updateResume } from "./resume";

describe("Resume Markdown Storage", () => {
  let mockDb: Partial<PrismaClient>;
  const userId = "test-user-id";

  beforeEach(() => {
    mockDb = {
      education: {
        createMany: vi.fn(),
        deleteMany: vi.fn(),
      } as any,
      experience: {
        createMany: vi.fn(),
        deleteMany: vi.fn(),
        findMany: vi.fn(),
      } as any,
      position: {
        createMany: vi.fn(),
      } as any,
      resume: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      } as any,
    };
  });

  it("should store accomplishments as markdown string", async () => {
    const mockResume = {
      contactInfoId: null,
      createdAt: new Date(),
      education: [],
      experience: [
        {
          companyName: "Test Company",
          id: 1,
          link: null,
          positions: [
            {
              accomplishments:
                "- First accomplishment\n- Second accomplishment\n- Third accomplishment",
              endDate: null,
              experienceId: 1,
              id: 1,
              location: "Test Location",
              startDate: new Date(),
              title: "Test Title",
            },
          ],
          resumeId: 1,
        },
      ],
      id: 1,
      jobId: null,
      name: "Test Resume",
      summary:
        "Professional summary paragraph.\n\nAnother paragraph of summary.",
      updatedAt: new Date(),
      userId,
    };

    (mockDb.resume!.create as any).mockResolvedValue({
      ...mockResume,
      contactInfo: null,
    });

    const input = {
      education: [],
      experience: [
        {
          companyName: "Test Company",
          positions: [
            {
              accomplishments:
                "- First accomplishment\n- Second accomplishment\n- Third accomplishment",
              location: "Test Location",
              startDate: new Date(),
              title: "Test Title",
            },
          ],
        },
      ],
      name: "Test Resume",
      professionalSummary:
        "Professional summary paragraph.\n\nAnother paragraph of summary.",
    };

    const result = await createResume(mockDb as PrismaClient, userId, input);

    expect(result.summary).toBe(
      "Professional summary paragraph.\n\nAnother paragraph of summary.",
    );
    expect(result.experience[0]?.positions[0]?.accomplishments).toBe(
      "- First accomplishment\n- Second accomplishment\n- Third accomplishment",
    );
  });

  it("should retrieve accomplishments as markdown string", async () => {
    const mockResume = {
      contactInfo: null,
      contactInfoId: null,
      createdAt: new Date(),
      education: [],
      experience: [
        {
          companyName: "Test Company",
          id: 1,
          link: null,
          positions: [
            {
              accomplishments: "- Item 1\n- Item 2\n- Item 3",
              endDate: null,
              experienceId: 1,
              id: 1,
              location: "Test Location",
              skillPosition: [],
              startDate: new Date(),
              title: "Test Title",
            },
          ],
          resumeId: 1,
        },
      ],
      id: 1,
      Job: null,
      jobId: null,
      name: "Test Resume",
      summary: "Summary as markdown string.",
      updatedAt: new Date(),
      userId,
    };

    (mockDb.resume!.findFirst as any).mockResolvedValue(mockResume);

    const result = await getResume(mockDb as PrismaClient, userId, {
      id: 1,
    });

    // Should return markdown strings directly without parsing
    expect(result.summary).toBe("Summary as markdown string.");
    expect(result.experience[0]?.positions[0]?.accomplishments).toBe(
      "- Item 1\n- Item 2\n- Item 3",
    );
  });

  it("should update accomplishments as markdown string", async () => {
    const existingResume = {
      contactInfoId: null,
      createdAt: new Date(),
      id: 1,
      jobId: null,
      name: "Test Resume",
      summary: "Old summary",
      updatedAt: new Date(),
      userId,
    };

    const updatedResume = {
      ...existingResume,
      contactInfo: null,
      education: [],
      experience: [
        {
          companyName: "Updated Company",
          id: 1,
          link: null,
          positions: [
            {
              accomplishments:
                "- Updated accomplishment 1\n- Updated accomplishment 2",
              endDate: null,
              experienceId: 1,
              id: 1,
              location: "Updated Location",
              startDate: new Date(),
              title: "Updated Title",
            },
          ],
          resumeId: 1,
        },
      ],
      summary: "Updated summary as markdown.",
    };

    (mockDb.resume!.findFirst as any).mockResolvedValue(existingResume);
    (mockDb.experience!.deleteMany as any).mockResolvedValue({ count: 0 });
    (mockDb.experience!.createMany as any).mockResolvedValue({ count: 1 });
    (mockDb.experience!.findMany as any).mockResolvedValue([
      { companyName: "Updated Company", id: 1 },
    ]);
    (mockDb.position!.createMany as any).mockResolvedValue({ count: 1 });
    (mockDb.resume!.update as any).mockResolvedValue(updatedResume);

    const result = await updateResume(mockDb as PrismaClient, userId, {
      experience: [
        {
          companyName: "Updated Company",
          positions: [
            {
              accomplishments:
                "- Updated accomplishment 1\n- Updated accomplishment 2",
              location: "Updated Location",
              startDate: new Date(),
              title: "Updated Title",
            },
          ],
        },
      ],
      id: 1,
      professionalSummary: "Updated summary as markdown.",
    });

    // Should store and return markdown strings directly
    expect(result.summary).toBe("Updated summary as markdown.");
    expect(result.experience[0]?.positions[0]?.accomplishments).toBe(
      "- Updated accomplishment 1\n- Updated accomplishment 2",
    );
  });
});
