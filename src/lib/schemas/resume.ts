import { z } from "zod";

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
  id: z.number(),
  name: z.string().optional(),
  professionalSummary: z.string().optional(), // Markdown string
});

export const updateResumeTitleSchema = z.object({
  id: z.number(),
  name: z.string().trim().min(1),
});

export const duplicateResumeSchema = z.object({
  id: z.number(),
  jobId: z.string().optional(),
  name: z.string().optional(),
});

export const createTailoredResumeFromProfileSchema = z.object({
  jobId: z.string().trim().min(1),
  name: z.string().trim().min(1).optional(),
});

export const getResumeSchema = z.object({ id: z.number() });
export const getResumeMarkdownSchema = getResumeSchema;

const resumeSortSchema = z.enum(["created", "last-updated", "name"]);

export const listResumesSchema = z
  .object({
    jobId: z.string().optional(),
    sort: resumeSortSchema.optional(),
  })
  .optional();

export const deleteResumeSchema = z.object({ id: z.number() });

// Agent-specific schemas
export const createResumeCopySchema = z.object({
  name: z.string().trim().min(1).optional(),
  sourceResumeId: z.number(),
});

export const updateAccomplishmentsSchema = z.object({
  accomplishments: z.string(), // Markdown string
  positionId: z.number(),
});

export const updateSummarySchema = z.object({
  resumeId: z.number(),
  summary: z.string(),
});

export const addExperienceSchema = z.object({
  accomplishments: z.string(), // Markdown string
  companyName: z.string(),
  endDate: z.string().optional(),
  location: z.string(),
  resumeId: z.number(),
  startDate: z.string(),
  title: z.string(),
});

export const updateSkillsSchema = z.object({
  positionId: z.number(),
  skills: z.array(z.string()),
});
