import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "~/generated/prisma/client";
import { addJob, getJobs } from "./job";

// Mock database with proper vi.fn() for all methods
const createMockDb = () => ({
  job: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
});

let mockDb: ReturnType<typeof createMockDb>;

describe("Job Business Logic", () => {
  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe("addJob", () => {
    it("should create a job with url", async () => {
      const userId = "user-123";
      const input = { url: "https://example.com/job" };

      await addJob(mockDb as unknown as PrismaClient, userId, input);

      expect(mockDb.job.create).toHaveBeenCalledWith({
        data: {
          url: input.url,
          userId: userId,
        },
      });
    });
  });

  describe("getJobs", () => {
    it("should return all jobs for a user", async () => {
      const userId = "user-123";

      const mockJobs = [
        {
          id: "job-1",
          url: "https://example.com/job1",
          userId: userId,
        },
        {
          id: "job-2",
          url: "https://example.com/job2",
          userId: userId,
        },
      ];

      mockDb.job.findMany.mockResolvedValue(mockJobs);

      const result = await getJobs(mockDb as unknown as PrismaClient, userId);

      expect(result).toEqual(mockJobs);
      expect(mockDb.job.findMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });
});
