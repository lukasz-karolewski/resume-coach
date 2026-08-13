import type { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "~/generated/prisma/client";
import {
  createResumePermalink,
  deleteResumePermalink,
  getPublicResumeBySlug,
} from "./resume-permalink";

function createMockDb() {
  return {
    resume: { findFirst: vi.fn() },
    resumePermalink: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
    },
  };
}

describe("resume permalinks", () => {
  let db: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    db = createMockDb();
  });

  it("returns the existing permalink without creating a second one", async () => {
    const existing = {
      createdAt: new Date(),
      resumeId: "Res001",
      slug: "existing-link",
    };
    db.resume.findFirst.mockResolvedValue({
      id: "Res001",
      permalink: existing,
    });

    await expect(
      createResumePermalink(db as unknown as PrismaClient, "user-1", {
        resumeId: "Res001",
        slug: "ignored-link",
      }),
    ).resolves.toBe(existing);
    expect(db.resumePermalink.create).not.toHaveBeenCalled();
  });

  it("creates a custom slug for an owned resume", async () => {
    const created = {
      createdAt: new Date(),
      resumeId: "Res001",
      slug: "Jane-Doe",
    };
    db.resume.findFirst.mockResolvedValue({ id: "Res001", permalink: null });
    db.resumePermalink.create.mockResolvedValue(created);

    await expect(
      createResumePermalink(db as unknown as PrismaClient, "user-1", {
        resumeId: "Res001",
        slug: "Jane-Doe",
      }),
    ).resolves.toBe(created);
    expect(db.resumePermalink.create).toHaveBeenCalledWith({
      data: { resumeId: "Res001", slug: "Jane-Doe" },
    });
  });

  it("reports a custom-slug conflict without exposing another resume", async () => {
    db.resume.findFirst.mockResolvedValue({ id: "Res001", permalink: null });
    db.resumePermalink.create.mockRejectedValue({ code: "P2002" });
    db.resumePermalink.findUnique.mockResolvedValue(null);

    await expect(
      createResumePermalink(db as unknown as PrismaClient, "user-1", {
        resumeId: "Res001",
        slug: "taken-link",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" } satisfies Partial<TRPCError>);
  });

  it("revokes idempotently after checking resume ownership", async () => {
    db.resume.findFirst.mockResolvedValue({ id: "Res001", permalink: null });
    db.resumePermalink.deleteMany.mockResolvedValue({ count: 0 });

    await expect(
      deleteResumePermalink(db as unknown as PrismaClient, "user-1", {
        resumeId: "Res001",
      }),
    ).resolves.toEqual({ success: true });
    expect(db.resumePermalink.deleteMany).toHaveBeenCalledWith({
      where: { resumeId: "Res001" },
    });
  });

  it("returns null for malformed or missing public slugs", async () => {
    await expect(
      getPublicResumeBySlug(db as unknown as PrismaClient, "bad_slug"),
    ).resolves.toBeNull();
    expect(db.resumePermalink.findUnique).not.toHaveBeenCalled();

    db.resumePermalink.findUnique.mockResolvedValue(null);
    await expect(
      getPublicResumeBySlug(db as unknown as PrismaClient, "valid-link"),
    ).resolves.toBeNull();
  });

  it("selects only printable resume fields for public rendering", async () => {
    const resume = { name: "Public Resume", summary: "Summary" };
    db.resumePermalink.findUnique.mockResolvedValue({ resume });

    await expect(
      getPublicResumeBySlug(db as unknown as PrismaClient, "public-link"),
    ).resolves.toBe(resume);

    const query = db.resumePermalink.findUnique.mock.calls[0]?.[0];
    const serializedSelection = JSON.stringify(query?.select);
    expect(serializedSelection).not.toContain('"userId"');
    expect(serializedSelection).not.toContain('"jobId"');
    expect(serializedSelection).not.toContain('"permalink"');
    expect(serializedSelection).not.toContain('"id"');
  });
});
