import { z } from "zod";

export const RESUME_ID_LENGTH = 6;
export const DEFAULT_PERMALINK_SLUG_LENGTH = 16;

/**
 * `/r/[slug]` is unauthenticated and renders the owner's name, email, and
 * phone, so a custom slug has to be long enough not to be enumerable. Eight
 * Base62 characters is ~2.2e14 combinations; three would have been ~238k.
 * Kept in step with the CHECK constraint on ResumePermalink.slug.
 */
export const MIN_PERMALINK_SLUG_LENGTH = 8;

export const resumeIdSchema = z
  .string()
  .length(RESUME_ID_LENGTH, "Resume ID must be six letters or numbers")
  .regex(/^[A-Za-z0-9]+$/, "Resume ID must be six letters or numbers");

export const permalinkSlugSchema = z
  .string()
  .trim()
  .min(MIN_PERMALINK_SLUG_LENGTH, "Use at least 8 characters")
  .max(64, "Use no more than 64 characters")
  .regex(
    /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/,
    "Use letters, numbers, and single hyphens between words",
  );

export const permalinkFormSchema = z.object({
  slug: z.union([z.literal(""), permalinkSlugSchema]),
});

export const createResumePermalinkSchema = z.object({
  resumeId: resumeIdSchema,
  slug: permalinkSlugSchema.optional(),
});

export const deleteResumePermalinkSchema = z.object({
  resumeId: resumeIdSchema,
});
