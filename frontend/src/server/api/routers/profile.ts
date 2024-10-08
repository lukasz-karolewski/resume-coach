import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const profileRouter = createTRPCRouter({
  getUserInfo: protectedProcedure.query(async ({ ctx }) => {
    const userInfo = await Promise.all([
      ctx.db.contactInfo.findFirst({
        where: { userId: ctx.session.user.id },
      }),
      ctx.db.professionalSummary.findFirst({
        where: { userId: ctx.session.user.id },
      }),
      ctx.db.skill.findMany({
        where: { userId: ctx.session.user.id },
      }),
      ctx.db.workExperience.findMany({
        where: { userId: ctx.session.user.id },
      }),
      ctx.db.education.findMany({
        where: { userId: ctx.session.user.id },
      }),
    ]);

    return {
      contactInfo: userInfo[0],
      professionalSummary: userInfo[1],
      skills: userInfo[2],
      workExperience: userInfo[3],
      education: userInfo[4],
    };
  }),
});
