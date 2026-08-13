import { z } from "zod";
import { RESUME_SECTION_TYPES } from "~/lib/resume-sections";
import { resumeIdSchema } from "~/lib/schemas/resume-identifiers";

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required.`);
const month = (label: string) =>
  z
    .string()
    .regex(
      /^\d{4}-(?:0[1-9]|1[0-2])$/,
      `Choose a valid ${label.toLowerCase()}.`,
    );
const optionalText = z.string().trim().min(1).optional();
const optionalUrl = z.url("Enter a valid URL.").optional();

export const experienceSectionItemSchema = z.object({
  accomplishments: requiredText("Accomplishments"),
  companyName: requiredText("Company"),
  endDate: month("End date").optional(),
  location: requiredText("Location"),
  roleTitle: requiredText("Role"),
  startDate: month("Start date"),
  type: z.literal("EXPERIENCE"),
});

export const educationSectionItemSchema = z.object({
  distinction: requiredText("Degree or distinction"),
  endDate: month("End date"),
  institution: requiredText("Institution"),
  link: optionalUrl,
  location: requiredText("Location"),
  notes: optionalText,
  startDate: month("Start date"),
  type: z.literal("EDUCATION"),
});

export const certificationSectionItemSchema = z.object({
  distinction: requiredText("Certification"),
  endDate: month("Completion date"),
  institution: requiredText("Issuer"),
  link: optionalUrl,
  location: requiredText("Location"),
  notes: optionalText,
  type: z.literal("CERTIFICATION"),
});

export const skillSectionItemSchema = z.object({
  name: requiredText("Skill"),
  type: z.literal("SKILLS_SUMMARY"),
});

export const patentSectionItemSchema = z.object({
  date: month("Date"),
  description: requiredText("Description"),
  link: optionalUrl,
  title: requiredText("Patent title"),
  type: z.literal("PATENTS"),
});

export const resumeSectionItemSchema = z.discriminatedUnion("type", [
  experienceSectionItemSchema,
  educationSectionItemSchema,
  certificationSectionItemSchema,
  skillSectionItemSchema,
  patentSectionItemSchema,
]);

export const addResumeSectionItemSchema = z.discriminatedUnion("type", [
  experienceSectionItemSchema.extend({ resumeId: resumeIdSchema }),
  educationSectionItemSchema.extend({ resumeId: resumeIdSchema }),
  certificationSectionItemSchema.extend({ resumeId: resumeIdSchema }),
  skillSectionItemSchema.extend({ resumeId: resumeIdSchema }),
  patentSectionItemSchema.extend({ resumeId: resumeIdSchema }),
]);

export const updateResumeSectionItemSchema = z.discriminatedUnion("type", [
  experienceSectionItemSchema.extend({
    itemId: z.number(),
    resumeId: resumeIdSchema,
  }),
  educationSectionItemSchema.extend({
    itemId: z.number(),
    resumeId: resumeIdSchema,
  }),
  certificationSectionItemSchema.extend({
    itemId: z.number(),
    resumeId: resumeIdSchema,
  }),
  skillSectionItemSchema.extend({
    itemId: z.number(),
    resumeId: resumeIdSchema,
  }),
  patentSectionItemSchema.extend({
    itemId: z.number(),
    resumeId: resumeIdSchema,
  }),
]);

export const deleteResumeSectionItemSchema = z.object({
  itemId: z.number(),
  resumeId: resumeIdSchema,
  type: z.enum(RESUME_SECTION_TYPES),
});

export const removeResumeSectionSchema = z.object({
  resumeId: resumeIdSchema,
  type: z.enum(RESUME_SECTION_TYPES),
});

export type ResumeSectionItem = z.infer<typeof resumeSectionItemSchema>;
