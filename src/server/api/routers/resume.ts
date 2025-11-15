"server-only";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  createResume,
  createResumeSchema,
  deleteResume,
  deleteResumeSchema,
  duplicateResume,
  duplicateResumeSchema,
  getResumeByCompanyName,
  getResumeById,
  getResumeByIdSchema,
  getResumeSchema,
  listResumes,
  listResumesSchema,
  updateResume,
  updateResumeSchema,
} from "~/server/lib/resume";
import { withErrorHandling } from "~/server/utils";

export const resumeRouter = createTRPCRouter({
  // Create a new resume
  create: protectedProcedure
    .input(createResumeSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => createResume(ctx.db, userId, input),
        "Failed to create resume",
      );
    }),

  // Delete resume
  delete: protectedProcedure
    .input(deleteResumeSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => deleteResume(ctx.db, userId, input),
        "Failed to delete resume",
      );
    }),

  // Duplicate resume (useful for creating job-specific versions)
  duplicate: protectedProcedure
    .input(duplicateResumeSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => duplicateResume(ctx.db, userId, input),
        "Failed to duplicate resume",
      );
    }),

  // Get resume by ID
  getById: protectedProcedure
    .input(getResumeByIdSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => getResumeById(ctx.db, userId, input),
        "Failed to get resume",
      );
    }),

  // Get resume by company name and version
  getResume: protectedProcedure
    .input(getResumeSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => getResumeByCompanyName(ctx.db, userId, input),
        "Failed to get resume",
      );
    }),

  // List all resumes for the current user
  list: protectedProcedure
    .input(listResumesSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => listResumes(ctx.db, userId, input),
        "Failed to list resumes",
      );
    }),

  // Update resume
  update: protectedProcedure
    .input(updateResumeSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => updateResume(ctx.db, userId, input),
        "Failed to update resume",
      );
    }),
});
