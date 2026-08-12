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

    it("stores the next action date as its UTC calendar day", async () => {
      mockDb.job.create.mockResolvedValue({ id: "job-1" });

      await addJob(mockDb as unknown as PrismaClient, "user-123", {
        company: "Acme",
        nextActionAt: new Date("2026-08-20T19:30:00.000Z"),
        status: "SAVED",
        title: "Staff Engineer",
        url: "https://example.com/job",
      });

      expect(mockDb.job.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          nextActionAt: new Date("2026-08-20T00:00:00.000Z"),
        }),
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
    const editInput = {
      company: "Acme",
      id: "job-1",
      location: "Hybrid",
      nextActionAt: null,
      notes: "Panel next week",
      status: "INTERVIEW" as const,
      title: "Staff Engineer",
      url: "https://example.com/job",
    };

    /** `resume.findFirst` serves both the ownership check and the primary lookup. */
    const mockResumes = (primary: { id: number } | null) => {
      mockDb.resume.findFirst.mockImplementation(
        async ({ where }: { where: { id?: number; jobId?: string } }) =>
          where.jobId ? primary : { id: where.id },
      );
    };

    it("swaps only the primary resume so unlisted duplicates keep their link", async () => {
      mockDb.job.findFirst.mockResolvedValue({ id: "job-1" });
      mockDb.job.update.mockResolvedValue({ id: "job-1" });
      mockResumes({ id: 8 });

      await updateJob(mockDb as unknown as PrismaClient, "user-123", {
        ...editInput,
        resumeId: 12,
      });

      expect(mockDb.job.findFirst).toHaveBeenCalledWith({
        select: { id: true },
        where: { id: "job-1", userId: "user-123" },
      });
      expect(mockDb.resume.update).toHaveBeenCalledWith({
        data: { jobId: null },
        where: { id: 8 },
      });
      expect(mockDb.resume.update).toHaveBeenCalledWith({
        data: { jobId: "job-1" },
        where: { id: 12 },
      });
      expect(mockDb.resume.update).toHaveBeenCalledTimes(2);
    });

    it("leaves every link alone when the primary resume is unchanged", async () => {
      mockDb.job.findFirst.mockResolvedValue({ id: "job-1" });
      mockDb.job.update.mockResolvedValue({ id: "job-1" });
      mockResumes({ id: 12 });

      await updateJob(mockDb as unknown as PrismaClient, "user-123", {
        ...editInput,
        resumeId: 12,
      });

      expect(mockDb.resume.update).not.toHaveBeenCalled();
    });

    it("detaches the primary resume when the link is cleared", async () => {
      mockDb.job.findFirst.mockResolvedValue({ id: "job-1" });
      mockDb.job.update.mockResolvedValue({ id: "job-1" });
      mockResumes({ id: 12 });

      await updateJob(mockDb as unknown as PrismaClient, "user-123", {
        ...editInput,
        resumeId: null,
      });

      expect(mockDb.resume.update).toHaveBeenCalledWith({
        data: { jobId: null },
        where: { id: 12 },
      });
      expect(mockDb.resume.update).toHaveBeenCalledTimes(1);
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
