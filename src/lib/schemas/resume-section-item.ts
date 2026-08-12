import { z } from "zod";
import { RESUME_SECTION_TYPES } from "~/lib/resume-sections";

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
  experienceSectionItemSchema.extend({ resumeId: z.number() }),
  educationSectionItemSchema.extend({ resumeId: z.number() }),
  certificationSectionItemSchema.extend({ resumeId: z.number() }),
  skillSectionItemSchema.extend({ resumeId: z.number() }),
  patentSectionItemSchema.extend({ resumeId: z.number() }),
]);

export const updateResumeSectionItemSchema = z.discriminatedUnion("type", [
  experienceSectionItemSchema.extend({
    itemId: z.number(),
    resumeId: z.number(),
  }),
  educationSectionItemSchema.extend({
    itemId: z.number(),
    resumeId: z.number(),
  }),
  certificationSectionItemSchema.extend({
    itemId: z.number(),
    resumeId: z.number(),
  }),
  skillSectionItemSchema.extend({ itemId: z.number(), resumeId: z.number() }),
  patentSectionItemSchema.extend({ itemId: z.number(), resumeId: z.number() }),
]);

export const deleteResumeSectionItemSchema = z.object({
  itemId: z.number(),
  resumeId: z.number(),
  type: z.enum(RESUME_SECTION_TYPES),
});

export const removeResumeSectionSchema = z.object({
  resumeId: z.number(),
  type: z.enum(RESUME_SECTION_TYPES),
});

export type ResumeSectionItem = z.infer<typeof resumeSectionItemSchema>;
