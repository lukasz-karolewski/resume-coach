import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const profileRouter = createTRPCRouter({
  getUserInfo: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const resume = await ctx.db.resume.findFirst({
      where: { Job: { userId } },
      include: {
        contactInfo: true,
        experience: {
          include: {
            positions: {
              include: {
                skillPosition: { include: { skill: true } },
              },
            },
          },
        },
        education: true,
      },
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
      experience?.positions.map(
        ({ title, startDate, endDate, location, accomplishments }) => ({
          title,
          startDate,
          endDate,
          location,
          accomplishments,
        }),
      ) ?? [];
    const skills =
      experience?.positions.flatMap((p) =>
        p.skillPosition.map((sp) => sp.skill),
      ) ?? [];
    return {
      contactInfo,
      professionalSummary,
      skills,
      workExperience,
      education,
    };
  }),
});
