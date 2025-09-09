import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const profileRouter = createTRPCRouter({
  getUserInfo: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const resume = await ctx.db.resume.findFirst({
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
      experience?.positions.map(
        ({ title, startDate, endDate, location, accomplishments }) => ({
          accomplishments,
          endDate,
          location,
          startDate,
          title,
        }),
      ) ?? [];
    const skills =
      experience?.positions.flatMap((p) =>
        p.skillPosition.map((sp) => sp.skill),
      ) ?? [];
    return {
      contactInfo,
      education,
      professionalSummary,
      skills,
      workExperience,
    };
  }),
});
