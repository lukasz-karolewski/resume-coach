import { describe, expect, test, vi } from "vitest";
import { getAccomplishmentProfile, saveAccomplishmentProfile } from "./profile";

describe("profile lib", () => {
  test("returns accomplishment profile roles ordered for editing", async () => {
    const db = {
      accomplishmentProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 1,
          roles: [
            {
              companyName: "Example Corp",
              endDate: null,
              entries: [
                {
                  content: "Launched a new onboarding flow.",
                  id: 100,
                  sortOrder: 0,
                },
              ],
              id: 10,
              location: "Remote",
              sortOrder: 0,
              startDate: new Date("2023-01-01T00:00:00.000Z"),
              title: "Senior Engineer",
            },
          ],
          userId: "user-123",
        }),
      },
    };

    await expect(
      getAccomplishmentProfile(db as never, "user-123"),
    ).resolves.toMatchObject({
      roles: [
        {
          companyName: "Example Corp",
          entries: [{ content: "Launched a new onboarding flow." }],
          title: "Senior Engineer",
        },
      ],
    });
  });

  test("returns null when the accomplishment profile table is not available yet", async () => {
    const db = {
      accomplishmentProfile: {
        findUnique: vi.fn().mockRejectedValue({
          code: "P2021",
          message:
            "The table `public.AccomplishmentProfile` does not exist in the current database.",
          meta: {
            table: "public.AccomplishmentProfile",
          },
        }),
      },
    };

    await expect(
      getAccomplishmentProfile(db as never, "user-123"),
    ).resolves.toBeNull();
  });

  test("rethrows unrelated prisma errors while reading accomplishment profiles", async () => {
    const error = {
      code: "P2021",
      message:
        "The table `public.Resume` does not exist in the current database.",
      meta: {
        table: "public.Resume",
      },
    };
    const db = {
      accomplishmentProfile: {
        findUnique: vi.fn().mockRejectedValue(error),
      },
    };

    await expect(
      getAccomplishmentProfile(db as never, "user-123"),
    ).rejects.toBe(error);
  });

  test("replaces the profile roles and accomplishments in a transaction", async () => {
    const transaction = {
      accomplishmentProfile: {
        findUnique: vi.fn().mockResolvedValue({
          id: 5,
          roles: [],
          userId: "user-123",
        }),
        upsert: vi.fn().mockResolvedValue({ id: 5, userId: "user-123" }),
      },
      accomplishmentRole: {
        create: vi.fn().mockResolvedValue({ id: 20 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const db = {
      $transaction: vi.fn(
        async (callback: (tx: typeof transaction) => unknown) =>
          callback(transaction),
      ),
    };

    await saveAccomplishmentProfile(db as never, "user-123", {
      roles: [
        {
          companyName: "Example Corp",
          endMonth: "",
          entries: [
            { content: "Reduced deploy time from 45 minutes to 8 minutes." },
          ],
          location: "Remote",
          startMonth: "2023-01",
          title: "Staff Engineer",
        },
      ],
    });

    expect(transaction.accomplishmentProfile.upsert).toHaveBeenCalledWith({
      create: { userId: "user-123" },
      update: {},
      where: { userId: "user-123" },
    });
    expect(transaction.accomplishmentRole.deleteMany).toHaveBeenCalledWith({
      where: { profileId: 5 },
    });
    expect(transaction.accomplishmentRole.create).toHaveBeenCalledWith({
      data: {
        companyName: "Example Corp",
        endDate: null,
        entries: {
          create: [
            {
              content: "Reduced deploy time from 45 minutes to 8 minutes.",
              sortOrder: 0,
            },
          ],
        },
        location: "Remote",
        profileId: 5,
        sortOrder: 0,
        startDate: new Date("2023-01-01T00:00:00.000Z"),
        title: "Staff Engineer",
      },
    });
  });
});
