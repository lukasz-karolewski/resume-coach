"server-only";

import type { PrismaClient } from "~/generated/prisma/client";

// ============================================================================
// Business Logic Functions
// ============================================================================

/**
 * Get user info (resume with contact info, education, experience, and skills)
 */
export async function getUserInfo(db: PrismaClient, userId: string) {
  const resume = await db.resume.findFirst({
    include: {
      contactInfo: true,
      education: true,
      experience: {
        include: {
          positions: {
            include: {
              skillPosition: { include: { skill: true } },
            },
          },
        },
      },
    },
    where: { Job: { userId } },
  });

  if (!resume) {
    throw new Error("Resume not found");
  }

  const {
    contactInfo,
    summary: professionalSummary,
    education,
    experience,
  } = resume;

  const workExperience =
    experience?.flatMap((exp) =>
      exp.positions.map(
        ({ title, startDate, endDate, location, accomplishments }) => ({
          accomplishments,
          endDate,
          location,
          startDate,
          title,
        }),
      ),
    ) ?? [];

  const skills =
    experience?.flatMap((exp) =>
      exp.positions.flatMap((p) => p.skillPosition.map((sp) => sp.skill)),
    ) ?? [];

  return {
    contactInfo,
    education,
    professionalSummary,
    skills,
    workExperience,
  };
}
