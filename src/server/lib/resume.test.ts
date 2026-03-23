import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "~/generated/prisma/client";
import { createResumeCopy } from "./resume";

describe("createResumeCopy", () => {
  let mockDb: Partial<PrismaClient>;

  beforeEach(() => {
    mockDb = {
      resume: {
        create: vi.fn(),
        findFirst: vi.fn(),
      } as any,
    };
  });

  it("creates a copy from a mock template for the current user", async () => {
    (mockDb.resume!.create as any).mockResolvedValue({
      id: 99,
      name: "Resume - Copy 123",
    });

    const result = await createResumeCopy(mockDb as PrismaClient, "user-123", {
      sourceResumeId: -1,
    });

    expect(mockDb.resume!.findFirst).not.toHaveBeenCalled();
    expect(mockDb.resume!.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        contactInfo: {
          create: expect.objectContaining({
            email: expect.any(String),
            name: expect.any(String),
            phone: expect.any(String),
          }),
        },
        education: {
          create: expect.any(Array),
        },
        experience: {
          create: expect.any(Array),
        },
        name: expect.stringContaining("Resume - Copy "),
        summary: expect.any(String),
        userId: "user-123",
      }),
    });
    expect(result).toEqual({
      name: "Resume - Copy 123",
      resumeId: 99,
      success: true,
    });
  });
});
