"server-only";

import { z } from "zod";
import type { PrismaClient } from "~/generated/prisma/client";
import { saveAccomplishmentProfileSchema } from "~/lib/schemas/profile";

/**
 * Get user info
 */
export async function getUserInfo(db: PrismaClient, userId: string) {
  const user = await db.user.findFirst({
    where: { id: userId },
  });
  return user;
}

export function parseMonthInput(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = z.iso.date().safeParse(`${value}-01`);

  if (!parsed.success) {
    return null;
  }

  return new Date(`${parsed.data}T00:00:00.000Z`);
}

function isMissingAccomplishmentProfileTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? error.code : undefined;
  const message = "message" in error ? error.message : undefined;
  const meta = "meta" in error ? error.meta : undefined;
  const metaTable =
    meta && typeof meta === "object" && "table" in meta
      ? meta.table
      : undefined;
  const mentionsAccomplishmentProfile =
    (typeof message === "string" &&
      message.includes("AccomplishmentProfile")) ||
    (typeof metaTable === "string" &&
      metaTable.includes("AccomplishmentProfile"));

  return code === "P2021" && mentionsAccomplishmentProfile;
}

export async function getAccomplishmentProfile(
  db: PrismaClient,
  userId: string,
) {
  try {
    return await db.accomplishmentProfile.findUnique({
      include: {
        roles: {
          include: {
            entries: {
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
          orderBy: {
            sortOrder: "asc",
          },
        },
      },
      where: {
        userId,
      },
    });
  } catch (error) {
    if (isMissingAccomplishmentProfileTableError(error)) {
      return null;
    }

    throw error;
  }
}

export async function saveAccomplishmentProfile(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof saveAccomplishmentProfileSchema>,
) {
  const parsedInput = saveAccomplishmentProfileSchema.parse(input);

  return db.$transaction(async (tx) => {
    const profile = await tx.accomplishmentProfile.upsert({
      create: {
        userId,
      },
      update: {},
      where: {
        userId,
      },
    });

    await tx.accomplishmentRole.deleteMany({
      where: {
        profileId: profile.id,
      },
    });

    await Promise.all(
      parsedInput.roles.map((role, roleIndex) =>
        tx.accomplishmentRole.create({
          data: {
            companyName: role.companyName,
            endDate: parseMonthInput(role.endMonth),
            entries: {
              create: role.entries.map((entry, entryIndex) => ({
                content: entry.content,
                sortOrder: entryIndex,
              })),
            },
            location: role.location || null,
            profileId: profile.id,
            sortOrder: roleIndex,
            startDate: parseMonthInput(role.startMonth),
            title: role.title,
          },
        }),
      ),
    );

    return getAccomplishmentProfile(tx as PrismaClient, userId);
  });
}
