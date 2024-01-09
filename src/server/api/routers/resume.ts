import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const resumeRouter = createTRPCRouter({
  getResume: protectedProcedure.query(async ({ ctx }) => {
    const resume = await ctx.db.resume.findFirst({
      where: { userId: ctx.session.user.id },
    });

    return resume;
  }),
});
