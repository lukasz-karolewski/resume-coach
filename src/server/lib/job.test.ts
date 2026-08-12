import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "~/generated/prisma/client";
import { addJob, getJobs, updateJob, updateJobStatus } from "./job";

// Mock database with proper vi.fn() for all methods
const createMockDb = () => ({
  $transaction: vi.fn(async (callback) => callback(mockDb)),
  job: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  resume: {
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
});

let mockDb: ReturnType<typeof createMockDb>;

describe("Job Business Logic", () => {
  beforeEach(() => {
    mockDb = createMockDb();
  });

  describe("addJob", () => {
    it("creates a trackable application and links the selected resume", async () => {
      const userId = "user-123";
      const input = {
        company: "Acme",
        location: "Remote",
        nextActionAt: new Date("2026-08-20T00:00:00.000Z"),
        notes: "Ask about the platform team.",
        resumeId: 42,
        status: "APPLIED" as const,
        title: "Staff Engineer",
        url: "https://example.com/job",
      };

      mockDb.job.create.mockResolvedValue({ id: "job-1" });
      mockDb.resume.findFirst.mockResolvedValue({ id: 42 });

      await addJob(mockDb as unknown as PrismaClient, userId, input);

      expect(mockDb.job.create).toHaveBeenCalledWith({
        data: {
          company: "Acme",
          location: "Remote",
          nextActionAt: input.nextActionAt,
          notes: "Ask about the platform team.",
          status: "APPLIED",
          title: "Staff Engineer",
          url: input.url,
          userId: userId,
        },
      });
      expect(mockDb.resume.update).toHaveBeenCalledWith({
        data: { jobId: "job-1" },
        where: { id: 42 },
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
        include: {
          resume: {
            orderBy: { updatedAt: "desc" },
            select: { id: true, name: true },
          },
        },
        orderBy: [
          { nextActionAt: { nulls: "last", sort: "asc" } },
          { createdAt: "desc" },
        ],
        where: { userId },
      });
    });
  });

  describe("updateJob", () => {
    it("updates only an owned application and replaces its linked resume", async () => {
      mockDb.job.findFirst.mockResolvedValue({ id: "job-1" });
      mockDb.resume.findFirst.mockResolvedValue({ id: 12 });
      mockDb.job.update.mockResolvedValue({ id: "job-1" });

      await updateJob(mockDb as unknown as PrismaClient, "user-123", {
        company: "Acme",
        id: "job-1",
        location: "Hybrid",
        nextActionAt: null,
        notes: "Panel next week",
        resumeId: 12,
        status: "INTERVIEW",
        title: "Staff Engineer",
        url: "https://example.com/job",
      });

      expect(mockDb.job.findFirst).toHaveBeenCalledWith({
        select: { id: true },
        where: { id: "job-1", userId: "user-123" },
      });
      expect(mockDb.resume.updateMany).toHaveBeenCalledWith({
        data: { jobId: null },
        where: { jobId: "job-1", userId: "user-123" },
      });
      expect(mockDb.resume.update).toHaveBeenCalledWith({
        data: { jobId: "job-1" },
        where: { id: 12 },
      });
    });

    it("does not reveal or update another user's application", async () => {
      mockDb.job.findFirst.mockResolvedValue(null);

      await expect(
        updateJob(mockDb as unknown as PrismaClient, "user-123", {
          company: "Acme",
          id: "job-other-user",
          status: "SAVED",
          title: "Engineer",
          url: "https://example.com/job",
        }),
      ).rejects.toThrow();

      expect(mockDb.job.update).not.toHaveBeenCalled();
    });
  });

  describe("updateJobStatus", () => {
    it("scopes status changes to an owned application", async () => {
      mockDb.job.findFirst.mockResolvedValue({ id: "job-1" });

      await updateJobStatus(mockDb as unknown as PrismaClient, "user-123", {
        id: "job-1",
        status: "OFFER",
      });

      expect(mockDb.job.findFirst).toHaveBeenCalledWith({
        select: { id: true },
        where: { id: "job-1", userId: "user-123" },
      });
      expect(mockDb.job.update).toHaveBeenCalledWith({
        data: { status: "OFFER" },
        where: { id: "job-1" },
      });
    });
  });
});
