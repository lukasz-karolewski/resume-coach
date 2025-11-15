"server-only";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { addJob, addJobSchema, getJobs } from "~/server/lib/job";
import { withErrorHandling } from "~/server/utils";

export const jobRouter = createTRPCRouter({
  addJob: protectedProcedure
    .input(addJobSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => addJob(ctx.db, userId, input),
        "Failed to add job",
      );
    }),

  getJobs: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id!;
    return withErrorHandling(
      () => getJobs(ctx.db, userId),
      "Failed to get jobs",
    );
  }),
});
