import { z } from "zod";

const accomplishmentEntrySchema = z.object({
  content: z.string().trim().min(1),
});

const accomplishmentRoleSchema = z.object({
  companyName: z.string().trim().min(1),
  endMonth: z.string().trim().optional(),
  entries: z.array(accomplishmentEntrySchema).default([]),
  location: z.string().trim().optional(),
  startMonth: z.string().trim().optional(),
  title: z.string().trim().min(1),
});

export const saveAccomplishmentProfileSchema = z.object({
  roles: z.array(accomplishmentRoleSchema).default([]),
});
