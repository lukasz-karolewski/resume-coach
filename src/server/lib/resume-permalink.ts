"server-only";

import { TRPCError } from "@trpc/server";
import type { z } from "zod";
import type { PrismaClient } from "~/generated/prisma/client";
import {
  type createResumePermalinkSchema,
  DEFAULT_PERMALINK_SLUG_LENGTH,
  type deleteResumePermalinkSchema,
  permalinkSlugSchema,
} from "~/lib/schemas/resume-identifiers";
import { generateBase62Id } from "~/server/lib/base62";

const PERMALINK_CREATE_ATTEMPTS = 5;

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

async function requireOwnedResumeWithPermalink(
  db: PrismaClient,
  userId: string,
  resumeId: string,
) {
  const resume = await db.resume.findFirst({
    select: { id: true, permalink: true },
    where: { id: resumeId, userId },
  });

  if (!resume) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Resume not found" });
  }

  return resume;
}

export async function createResumePermalink(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof createResumePermalinkSchema>,
) {
  const resume = await requireOwnedResumeWithPermalink(
    db,
    userId,
    input.resumeId,
  );

  if (resume.permalink) return resume.permalink;

  const attempts = input.slug ? 1 : PERMALINK_CREATE_ATTEMPTS;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const slug = input.slug ?? generateBase62Id(DEFAULT_PERMALINK_SLUG_LENGTH);

    try {
      return await db.resumePermalink.create({
        data: { resumeId: input.resumeId, slug },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;

      const existing = await db.resumePermalink.findUnique({
        where: { resumeId: input.resumeId },
      });
      if (existing) return existing;

      if (input.slug) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "That public link is already in use. Choose another one.",
        });
      }
    }
  }

  throw new Error("Unable to allocate a unique public link");
}

export async function deleteResumePermalink(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof deleteResumePermalinkSchema>,
) {
  await requireOwnedResumeWithPermalink(db, userId, input.resumeId);
  await db.resumePermalink.deleteMany({ where: { resumeId: input.resumeId } });

  return { success: true };
}

export async function getPublicResumeBySlug(
  db: PrismaClient,
  untrustedSlug: string,
) {
  const parsedSlug = permalinkSlugSchema.safeParse(untrustedSlug);
  if (!parsedSlug.success) return null;

  const permalink = await db.resumePermalink.findUnique({
    select: {
      resume: {
        select: {
          contactInfo: {
            select: { email: true, name: true, phone: true },
          },
          education: {
            select: {
              distinction: true,
              endDate: true,
              institution: true,
              link: true,
              location: true,
              notes: true,
              startDate: true,
              type: true,
            },
          },
          experience: {
            select: {
              companyName: true,
              link: true,
              positions: {
                orderBy: { startDate: "desc" },
                select: {
                  accomplishments: true,
                  endDate: true,
                  location: true,
                  skillPosition: {
                    select: { skill: { select: { name: true } } },
                  },
                  startDate: true,
                  title: true,
                },
              },
            },
          },
          name: true,
          patents: {
            orderBy: { date: "desc" },
            select: {
              date: true,
              description: true,
              link: true,
              title: true,
            },
          },
          skills: {
            select: { skill: { select: { name: true } } },
          },
          summary: true,
        },
      },
    },
    where: { slug: parsedSlug.data },
  });

  return permalink?.resume ?? null;
}
