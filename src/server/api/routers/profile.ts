"server-only";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getUserInfo } from "~/server/lib/profile";
import { withErrorHandling } from "~/server/utils";

export const profileRouter = createTRPCRouter({
  getUserInfo: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id!;
    return withErrorHandling(
      () => getUserInfo(ctx.db, userId),
      "Failed to get user info",
    );
  }),
});
