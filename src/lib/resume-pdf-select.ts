import type { Prisma } from "~/generated/prisma/client";

/**
 * The exact resume projection the PDF renderer needs.
 *
 * This is the single source of truth for the public resume payload: the
 * unauthenticated `/r/[slug]` query selects with it, and `ResumePdfData` is
 * derived from it, so dropping a field here becomes a type error at the render
 * site rather than an `undefined` in the generated PDF.
 *
 * It is a strict allowlist. Row IDs are deliberately absent — they are not
 * needed to render and would leak table-size ordering to anonymous viewers.
 */
export const resumePdfSelect = {
  contactInfo: {
    select: { email: true, name: true, phone: true },
  },
  education: {
    select: {
      distinction: true,
      endDate: true,
      institution: true,
      link: true,
      location: true,
      notes: true,
      startDate: true,
      type: true,
    },
  },
  experience: {
    select: {
      companyName: true,
      link: true,
      positions: {
        orderBy: { startDate: "desc" },
        select: {
          accomplishments: true,
          endDate: true,
          location: true,
          skillPosition: {
            select: { skill: { select: { name: true } } },
          },
          startDate: true,
          title: true,
        },
      },
    },
  },
  name: true,
  patents: {
    orderBy: { date: "desc" },
    select: {
      date: true,
      description: true,
      link: true,
      title: true,
    },
  },
  skills: {
    select: { skill: { select: { name: true } } },
  },
  summary: true,
} satisfies Prisma.ResumeSelect;

export type ResumePdfData = Prisma.ResumeGetPayload<{
  select: typeof resumePdfSelect;
}>;
