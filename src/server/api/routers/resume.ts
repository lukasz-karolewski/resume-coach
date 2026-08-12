"server-only";

import {
  createResumeSchema,
  createTailoredResumeFromProfileSchema,
  deleteResumeSchema,
  duplicateResumeSchema,
  getResumeSchema,
  listResumesSchema,
  updateAccomplishmentsSchema,
  updateResumeSchema,
  updateResumeTitleSchema,
  updateSummarySchema,
} from "~/lib/schemas/resume";
import {
  addResumeSectionItemSchema,
  deleteResumeSectionItemSchema,
  removeResumeSectionSchema,
  updateResumeSectionItemSchema,
} from "~/lib/schemas/resume-section-item";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  addResumeSectionItem,
  createResume,
  createTailoredResumeFromProfile,
  deleteResume,
  deleteResumeSectionItem,
  duplicateResume,
  getResume,
  listResumes,
  removeResumeSection,
  updateAccomplishments,
  updateResume,
  updateResumeSectionItem,
  updateResumeTitle,
  updateSummary,
} from "~/server/lib/resume";
import { withErrorHandling } from "~/server/utils";

export const resumeRouter = createTRPCRouter({
  addSectionItem: protectedProcedure
    .input(addResumeSectionItemSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => addResumeSectionItem(ctx.db, userId, input),
        "Failed to add resume section item",
      );
    }),

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

  createTailoredFromProfile: protectedProcedure
    .input(createTailoredResumeFromProfileSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => createTailoredResumeFromProfile(ctx.db, userId, input),
        "Failed to generate tailored resume",
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

  deleteSectionItem: protectedProcedure
    .input(deleteResumeSectionItemSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => deleteResumeSectionItem(ctx.db, userId, input),
        "Failed to delete resume section item",
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
    .input(getResumeSchema)
    .query(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => getResume(ctx.db, userId, input),
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

  removeSection: protectedProcedure
    .input(removeResumeSectionSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => removeResumeSection(ctx.db, userId, input),
        "Failed to remove resume section",
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

  updateAccomplishments: protectedProcedure
    .input(updateAccomplishmentsSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => updateAccomplishments(ctx.db, userId, input),
        "Failed to update accomplishments",
      );
    }),

  updateSectionItem: protectedProcedure
    .input(updateResumeSectionItemSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => updateResumeSectionItem(ctx.db, userId, input),
        "Failed to update resume section item",
      );
    }),

  updateSummary: protectedProcedure
    .input(updateSummarySchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => updateSummary(ctx.db, userId, input),
        "Failed to update summary",
      );
    }),

  updateTitle: protectedProcedure
    .input(updateResumeTitleSchema)
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id!;
      return withErrorHandling(
        () => updateResumeTitle(ctx.db, userId, input),
        "Failed to update resume title",
      );
    }),
});
