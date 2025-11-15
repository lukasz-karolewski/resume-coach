import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { EducationType } from "~/generated/prisma/client";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { mockDB } from "~/server/db-mock-data";

// ============================================================================
// Zod Schemas for CRUD Operations
// ============================================================================

const positionSchema = z.object({
  accomplishments: z.array(z.string()),
  endDate: z.date().optional(),
  id: z.number().optional(),
  location: z.string(),
  startDate: z.date(),
  title: z.string(),
});

const experienceSchema = z.object({
  companyName: z.string(),
  id: z.number().optional(),
  link: z.string().optional(),
  positions: z.array(positionSchema),
});

const educationSchema = z.object({
  distinction: z.string(),
  endDate: z.date(),
  id: z.number().optional(),
  institution: z.string(),
  link: z.string(),
  location: z.string(),
  notes: z.string().optional(),
  startDate: z.date(),
  type: z.enum(EducationType),
});

const contactInfoSchema = z.object({
  email: z.email(),
  id: z.number().optional(),
  name: z.string(),
  phone: z.string(),
});

export const resumeRouter = createTRPCRouter({
  // ============================================================================
  // CRUD Operations
  // ============================================================================

  // Create a new resume
  create: protectedProcedure
    .input(
      z.object({
        contactInfo: contactInfoSchema.optional(),
        education: z.array(educationSchema).default([]),
        experience: z.array(experienceSchema).default([]),
        jobId: z
          .string()
          .optional()
          .transform((val) => val || undefined),
        name: z.string().default("New Resume"),
        professionalSummary: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.session.user.id;

      console.log("DEBUG resume.create input:", JSON.stringify(input, null, 2));
      console.log("DEBUG userId:", userId);

      // Validate jobId if provided
      if (input.jobId) {
        const job = await ctx.db.job.findFirst({
          where: {
            id: input.jobId,
            userId: userId,
          },
        });

        if (!job) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Job not found or does not belong to user",
          });
        }
      }

      // First create contact info if provided
      let contactInfoId: number | undefined;
      if (input.contactInfo) {
        const contactInfo = await ctx.db.contactInfo.create({
          data: {
            email: input.contactInfo.email,
            name: input.contactInfo.name,
            phone: input.contactInfo.phone,
          },
        });
        contactInfoId = contactInfo.id;
      }

      // Create resume with nested relations
      console.log("DEBUG creating resume with data:", {
        contactInfoId: contactInfoId ?? null,
        jobId: input.jobId ?? null,
        name: input.name,
        userId: userId,
      });

      const resume = await ctx.db.resume.create({
        data: {
          contactInfoId: contactInfoId ?? null,
          education: {
            create: input.education.map((edu) => ({
              distinction: edu.distinction,
              endDate: edu.endDate,
              institution: edu.institution,
              link: edu.link,
              location: edu.location,
              notes: edu.notes,
              startDate: edu.startDate,
              type: edu.type,
            })),
          },
          experience: {
            create: input.experience.map((exp) => ({
              companyName: exp.companyName,
              link: exp.link,
              positions: {
                create: exp.positions.map((pos) => ({
                  accomplishments: JSON.stringify(pos.accomplishments),
                  endDate: pos.endDate,
                  location: pos.location,
                  startDate: pos.startDate,
                  title: pos.title,
                })),
              },
            })),
          },
          jobId: input.jobId ?? null,
          name: input.name,
          summary: JSON.stringify(input.professionalSummary),
          userId: userId!,
        },
        include: {
          contactInfo: true,
          education: true,
          experience: {
            include: {
              positions: true,
            },
          },
        },
      });

      return resume;
    }),

  // Delete resume
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Verify ownership
      const existing = await ctx.db.resume.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resume not found",
        });
      }

      await ctx.db.resume.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  // Duplicate resume (useful for creating job-specific versions)
  duplicate: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        jobId: z
          .string()
          .optional()
          .transform((val) => val || undefined),
        name: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Validate jobId if provided
      if (input.jobId) {
        const job = await ctx.db.job.findFirst({
          where: {
            id: input.jobId,
            userId: ctx.session.user.id,
          },
        });

        if (!job) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Job not found or does not belong to user",
          });
        }
      }

      // Get original resume
      const original = await ctx.db.resume.findFirst({
        include: {
          contactInfo: true,
          education: true,
          experience: {
            include: {
              positions: true,
            },
          },
        },
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!original) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resume not found",
        });
      }

      // Create duplicate
      const duplicate = await ctx.db.resume.create({
        data: {
          name: input.name ?? `${original.name} (Copy)`,
          user: {
            connect: { id: ctx.session.user.id },
          },
          ...(input.jobId && {
            Job: {
              connect: { id: input.jobId },
            },
          }),
          ...(original.contactInfo && {
            contactInfo: {
              create: {
                email: original.contactInfo.email,
                name: original.contactInfo.name,
                phone: original.contactInfo.phone,
              },
            },
          }),
          education: {
            create: original.education.map((edu) => ({
              distinction: edu.distinction,
              endDate: edu.endDate,
              institution: edu.institution,
              link: edu.link,
              location: edu.location,
              notes: edu.notes,
              startDate: edu.startDate,
              type: edu.type,
            })),
          },
          experience: {
            create: original.experience.map((exp) => ({
              companyName: exp.companyName,
              link: exp.link,
              positions: {
                create: exp.positions.map((pos) => ({
                  accomplishments: pos.accomplishments,
                  endDate: pos.endDate,
                  location: pos.location,
                  startDate: pos.startDate,
                  title: pos.title,
                })),
              },
            })),
          },
          summary: original.summary,
        },
        include: {
          contactInfo: true,
          education: true,
          experience: {
            include: {
              positions: true,
            },
          },
        },
      });

      return {
        ...duplicate,
        experience: duplicate.experience.map((exp) => ({
          ...exp,
          positions: exp.positions.map((pos) => ({
            ...pos,
            accomplishments: JSON.parse(
              pos.accomplishments as string,
            ) as string[],
          })),
        })),
        summary: JSON.parse(duplicate.summary) as string[],
      };
    }),

  // Get resume by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      // Handle negative IDs as mock templates
      if (input.id < 0) {
        const mockTemplates = Object.values(mockDB);
        const templateIndex = Math.abs(input.id) - 1;
        const template = mockTemplates[templateIndex];

        if (!template) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Template not found",
          });
        }

        return template;
      }

      const resume = await ctx.db.resume.findFirst({
        include: {
          contactInfo: true,
          education: true,
          experience: {
            include: {
              positions: {
                include: {
                  skillPosition: {
                    include: {
                      skill: true,
                    },
                  },
                },
              },
            },
          },
          Job: true,
        },
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!resume) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resume not found",
        });
      }

      // Parse JSON fields
      return {
        ...resume,
        experience: resume.experience.map((exp) => ({
          ...exp,
          positions: exp.positions.map((pos) => ({
            ...pos,
            accomplishments: JSON.parse(pos.accomplishments) as string[],
          })),
        })),
        summary: JSON.parse(resume.summary) as string[],
      };
    }),

  getResume: protectedProcedure
    .input(
      z.object({
        company_name: z.string(),
        version: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // if id in mockDB, return else, query actual DB
      if (Object.keys(mockDB).includes(input.company_name.toLowerCase())) {
        return mockDB[input.company_name.toLowerCase()];
      }

      // Query actual DB if not in mockDB
      const resume = await ctx.db.resume.findFirst({
        include: {
          contactInfo: true,
          education: true,
          experience: {
            include: {
              positions: true,
            },
          },
        },
        where: {
          name: input.company_name,
          userId: ctx.session.user.id,
        },
      });

      if (!resume) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resume not found",
        });
      }

      // Parse JSON fields
      return {
        ...resume,
        experience: resume.experience.map((exp) => ({
          ...exp,
          positions: exp.positions.map((pos) => ({
            ...pos,
            accomplishments: JSON.parse(pos.accomplishments) as string[],
          })),
        })),
        summary: JSON.parse(resume.summary) as string[],
      };
    }),

  // List all resumes for the current user
  list: protectedProcedure
    .input(
      z
        .object({
          jobId: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input, ctx }) => {
      const resumes = await ctx.db.resume.findMany({
        include: {
          _count: {
            select: {
              education: true,
              experience: true,
            },
          },
          contactInfo: true,
          Job: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        where: {
          userId: ctx.session.user.id,
          ...(input?.jobId ? { jobId: input.jobId } : {}),
        },
      });

      // Parse JSON fields from database resumes
      const dbResumes = resumes.map((resume) => ({
        ...resume,
        summary: JSON.parse(resume.summary) as string[],
      }));

      // Add mock resumes with proper structure for the list view
      // Note: Mock resumes are read-only templates, use negative IDs to distinguish them
      const mockResumes = Object.values(mockDB).map((resume, index) => ({
        _count: {
          education: resume.education.length,
          experience: resume.experience.length,
        },
        contactInfo: resume.contactInfo,
        contactInfoId: resume.contactInfoId,
        createdAt: resume.createdAt,
        id: -(index + 1), // Negative IDs for mock resumes
        Job: null,
        jobId: resume.jobId,
        name: resume.name,
        summary: resume.summary,
        updatedAt: resume.updatedAt,
        userId: resume.userId,
      }));

      // Combine and return all resumes
      return [...dbResumes, ...mockResumes];
    }),

  // Update resume
  update: protectedProcedure
    .input(
      z.object({
        contactInfo: contactInfoSchema.optional(),
        education: z.array(educationSchema).optional(),
        experience: z.array(experienceSchema).optional(),
        id: z.number(),
        name: z.string().optional(),
        professionalSummary: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify ownership
      const existing = await ctx.db.resume.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resume not found",
        });
      }

      // Update contact info if provided
      if (input.contactInfo) {
        if (existing.contactInfoId) {
          await ctx.db.contactInfo.update({
            data: {
              email: input.contactInfo.email,
              name: input.contactInfo.name,
              phone: input.contactInfo.phone,
            },
            where: { id: existing.contactInfoId },
          });
        } else {
          // Create new contact info and connect to resume
          const newContactInfo = await ctx.db.contactInfo.create({
            data: {
              email: input.contactInfo.email,
              name: input.contactInfo.name,
              phone: input.contactInfo.phone,
            },
          });
          await ctx.db.resume.update({
            data: {
              contactInfo: {
                connect: { id: newContactInfo.id },
              },
            },
            where: { id: input.id },
          });
        }
      }

      // Handle experience updates
      if (input.experience) {
        // Delete existing experiences
        await ctx.db.experience.deleteMany({
          where: { resumeId: input.id },
        });

        // Create new experiences
        await ctx.db.experience.createMany({
          data: input.experience.map((exp) => ({
            companyName: exp.companyName,
            link: exp.link,
            resumeId: input.id,
          })),
        });

        // Get created experiences and add positions
        const experiences = await ctx.db.experience.findMany({
          where: { resumeId: input.id },
        });

        for (let i = 0; i < input.experience.length; i++) {
          const exp = input.experience[i];
          const dbExp = experiences[i];
          if (exp && dbExp) {
            await ctx.db.position.createMany({
              data: exp.positions.map((pos) => ({
                accomplishments: JSON.stringify(pos.accomplishments),
                endDate: pos.endDate,
                experienceId: dbExp.id,
                location: pos.location,
                startDate: pos.startDate,
                title: pos.title,
              })),
            });
          }
        }
      }

      // Handle education updates
      if (input.education) {
        // Delete existing education
        await ctx.db.education.deleteMany({
          where: { resumeId: input.id },
        });

        // Create new education
        await ctx.db.education.createMany({
          data: input.education.map((edu) => ({
            distinction: edu.distinction,
            endDate: edu.endDate,
            institution: edu.institution,
            link: edu.link,
            location: edu.location,
            notes: edu.notes,
            resumeId: input.id,
            startDate: edu.startDate,
            type: edu.type,
          })),
        });
      }

      // Update resume
      const updated = await ctx.db.resume.update({
        data: {
          ...(input.name && { name: input.name }),
          ...(input.professionalSummary && {
            summary: JSON.stringify(input.professionalSummary),
          }),
        },
        include: {
          contactInfo: true,
          education: true,
          experience: {
            include: {
              positions: true,
            },
          },
        },
        where: { id: input.id },
      });

      return {
        ...updated,
        experience: updated.experience.map((exp) => ({
          ...exp,
          positions: exp.positions.map((pos) => ({
            ...pos,
            accomplishments: JSON.parse(pos.accomplishments) as string[],
          })),
        })),
        summary: JSON.parse(updated.summary) as string[],
      };
    }),
});
