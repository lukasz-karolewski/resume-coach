import { z } from "zod";

export const jobStatuses = [
  "SAVED",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
] as const;

export const jobStatusSchema = z.enum(jobStatuses);

export const jobStatusLabels: Record<
  z.infer<typeof jobStatusSchema>,
  string
> = {
  APPLIED: "Applied",
  INTERVIEW: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
  SAVED: "Saved",
  WITHDRAWN: "Withdrawn",
};

export const addJobSchema = z.object({
  company: z
    .string()
    .trim()
    .min(1, "Enter the company name.")
    .max(120, "Keep the company name under 120 characters."),
  location: z
    .string()
    .trim()
    .max(160, "Keep the location under 160 characters.")
    .optional(),
  nextActionAt: z.date().nullable().optional(),
  notes: z
    .string()
    .trim()
    .max(4000, "Keep notes under 4,000 characters.")
    .optional(),
  resumeId: z.number().int().positive().nullable().optional(),
  status: jobStatusSchema,
  title: z
    .string()
    .trim()
    .min(1, "Enter the position title.")
    .max(160, "Keep the position title under 160 characters."),
  url: z.url("Enter a valid job posting URL."),
});

export const updateJobSchema = addJobSchema.extend({
  id: z.string().min(1),
});

export const updateJobStatusSchema = z.object({
  id: z.string().min(1),
  status: jobStatusSchema,
});
