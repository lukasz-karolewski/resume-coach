import { z } from "zod";
import { resumeIdSchema } from "~/lib/schemas/resume-identifiers";

// Mirrors Prisma's `EducationType`. Declared here rather than imported so this
// module stays client-importable, the same way `job.ts` carries `jobStatuses`.
export const EDUCATION_TYPES = ["EDUCATION", "CERTIFICATION"] as const;

export const positionSchema = z.object({
  accomplishments: z.string(), // Markdown string
  endDate: z.date().optional(),
  id: z.number().optional(),
  location: z.string(),
  startDate: z.date(),
  title: z.string(),
});

export const experienceSchema = z.object({
  companyName: z.string(),
  id: z.number().optional(),
  link: z.string().optional(),
  positions: z.array(positionSchema),
});

export const educationSchema = z.object({
  distinction: z.string(),
  endDate: z.date(),
  id: z.number().optional(),
  institution: z.string(),
  link: z.string(),
  location: z.string(),
  notes: z.string().optional(),
  startDate: z.date(),
  type: z.enum(EDUCATION_TYPES),
});

export const contactInfoSchema = z.object({
  email: z.email(),
  id: z.number().optional(),
  name: z.string(),
  phone: z.string(),
});

export const createResumeSchema = z.object({
  contactInfo: contactInfoSchema.optional(),
  education: z.array(educationSchema).default([]),
  experience: z.array(experienceSchema).default([]),
  jobId: z.string().optional(),
  name: z.string().default("New Resume"),
  professionalSummary: z.string().default(""), // Markdown string
});

export const updateResumeSchema = z.object({
  contactInfo: contactInfoSchema.optional(),
  education: z.array(educationSchema).optional(),
  experience: z.array(experienceSchema).optional(),
  id: resumeIdSchema,
  name: z.string().optional(),
  professionalSummary: z.string().optional(), // Markdown string
});

export const updateResumeTitleSchema = z.object({
  id: resumeIdSchema,
  name: z.string().trim().min(1),
});

export const duplicateResumeSchema = z.object({
  id: resumeIdSchema,
  jobId: z.string().optional(),
  name: z.string().optional(),
});

export const createTailoredResumeFromProfileSchema = z.object({
  jobId: z.string().trim().min(1),
  name: z.string().trim().min(1).optional(),
});

export const getResumeSchema = z.object({ id: resumeIdSchema });
export const getResumeMarkdownSchema = getResumeSchema;

const resumeSortSchema = z.enum(["created", "last-updated", "name"]);

export const listResumesSchema = z
  .object({
    jobId: z.string().optional(),
    sort: resumeSortSchema.optional(),
  })
  .optional();

export const deleteResumeSchema = z.object({ id: resumeIdSchema });

// Agent-specific schemas
export const createResumeCopySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .optional()
    .describe("Name for the new resume copy; the source resume is unchanged"),
  sourceResumeId: resumeIdSchema.describe(
    "ID of the owned resume to copy; obtain it from listResumes",
  ),
});

export const updateAccomplishmentsSchema = z.object({
  accomplishments: z
    .string()
    .describe("Complete replacement accomplishments in Markdown list format"),
  positionId: z
    .number()
    .int()
    .positive()
    .describe("Position ID from getResume, not an experience or resume ID"),
});

export const updateSummarySchema = z.object({
  resumeId: resumeIdSchema.describe("Owned resume ID from listResumes"),
  summary: z
    .string()
    .describe("Complete replacement professional summary in Markdown"),
});

export const addExperienceSchema = z.object({
  accomplishments: z
    .string()
    .describe("Accomplishments for the new position in Markdown list format"),
  companyName: z.string().trim().min(1).describe("Employer name"),
  endDate: z
    .string()
    .optional()
    .describe("Optional ISO 8601 date; omit for a current position"),
  location: z.string().trim().describe("Position location, such as Remote"),
  resumeId: resumeIdSchema.describe("Owned resume ID from listResumes"),
  startDate: z.string().describe("Required ISO 8601 start date"),
  title: z.string().trim().min(1).describe("Job title"),
});

export const updateSkillsSchema = z.object({
  positionId: z
    .number()
    .int()
    .positive()
    .describe("Position ID from getResume, not an experience or resume ID"),
  skills: z
    .array(z.string().trim().min(1))
    .describe("Complete replacement list of skills for the position"),
});

export const deleteResumeToolSchema = z.object({
  resumeId: resumeIdSchema.describe(
    "Owned resume ID to permanently delete; verify with getResume first",
  ),
});
