"server-only";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  getAccomplishmentProfile,
  getUserInfo,
  saveAccomplishmentProfile,
  saveAccomplishmentProfileSchema,
} from "~/server/lib/profile";
import { withErrorHandling } from "~/server/utils";

export const profileRouter = createTRPCRouter({
  getAccomplishmentProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id!;
    return withErrorHandling(
      () => getAccomplishmentProfile(ctx.db, userId),
      "Failed to get accomplishment profile",
    );
  }),

  getUserInfo: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id!;
    return withErrorHandling(
      () => getUserInfo(ctx.db, userId),
      "Failed to get user info",
    );
  }),

  saveAccomplishmentProfile: protectedProcedure
    .input(saveAccomplishmentProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => saveAccomplishmentProfile(ctx.db, userId, input),
        "Failed to save accomplishment profile",
      );
    }),
});
