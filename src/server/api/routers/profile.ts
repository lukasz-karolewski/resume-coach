"server-only";

import { saveAccomplishmentProfileSchema } from "~/lib/schemas/profile";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  disconnectApp,
  disconnectConnectedAppInputSchema,
  listConnectedApps,
} from "~/server/lib/connected-access";
import {
  getAccomplishmentProfile,
  getUserInfo,
  saveAccomplishmentProfile,
} from "~/server/lib/profile";
import { withErrorHandling } from "~/server/utils";

export const profileRouter = createTRPCRouter({
  disconnectConnectedApp: protectedProcedure
    .input(disconnectConnectedAppInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => disconnectApp(ctx.db, { ...input, userId }),
        "Failed to disconnect app",
      );
    }),

  getAccomplishmentProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id!;
    return withErrorHandling(
      () => getAccomplishmentProfile(ctx.db, userId),
      "Failed to get accomplishment profile",
    );
  }),

  getConnectedApps: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id!;
    return withErrorHandling(
      () => listConnectedApps(ctx.db, { userId }),
      "Failed to get connected apps",
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
