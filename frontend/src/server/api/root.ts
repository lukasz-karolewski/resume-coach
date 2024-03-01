import { coachRouter } from "~/server/api/routers/coach";
import { jobRouter } from "~/server/api/routers/job";
import { profileRouter } from "~/server/api/routers/profile";
import { createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  coach: coachRouter,
  job: jobRouter,
  profile: profileRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
