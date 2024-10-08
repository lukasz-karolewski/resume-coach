import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const coachRouter = createTRPCRouter({
  getResume: protectedProcedure.query(async ({ ctx }) => {}),
});
