import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { extractJobDetails } from "~/server/llm/getJobDetails";

export const jobRouter = createTRPCRouter({
  getJobs: protectedProcedure.query(async ({ ctx }) => {
    const jobs = await ctx.db.job.findMany();

    return jobs;
  }),

  addJob: protectedProcedure
    .input(
      z.object({
        url: z.string().url(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const job = await ctx.db.job.create({
        data: {
          userId: ctx.session.user.id!,
          url: input.url,
        },
      });

      // TODO
      // scrape the job details
      // sent push notification it's done

      const details = await extractJobDetails(input.url);

      await ctx.db.job.update({
        where: {
          id: job.id,
        },
        data: {
          title: details.title,
          description: details.description,
          company: details.companyName,
        },
      });

      return job;
    }),
});
