"server-only";

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { EducationType, type PrismaClient } from "~/generated/prisma/client";

// ============================================================================
// Zod Schemas for CRUD Operations
// ============================================================================

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
  type: z.enum(EducationType),
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

export const duplicateResumeSchema = z.object({
  id: z.number(),
  jobId: z.string().optional(),
  name: z.string().optional(),
});

export const getResumeSchema = z.object({ id: z.number() });
export const getResumeMarkdownSchema = getResumeSchema;

export const listResumesSchema = z
  .object({
    jobId: z.string().optional(),
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

type ResumeWithMarkdownRelations = Awaited<ReturnType<typeof getResume>>;

function formatDateRange(startDate: Date, endDate?: Date | null) {
  const start = startDate.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  const end = endDate
    ? endDate.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "Present";

  return `${start} - ${end}`;
}

function formatMarkdownLink(label: string, href?: string | null) {
  if (!href) {
    return label;
  }

  return `[${label}](${href})`;
}

function normalizeMarkdownBlock(value?: string | null) {
  return value?.trim() ?? "";
}

function collectResumeSkills(resume: ResumeWithMarkdownRelations) {
  const skillNames = new Set<string>();

  for (const experience of resume.experience) {
    for (const position of experience.positions) {
      for (const skillPosition of position.skillPosition ?? []) {
        if (skillPosition.skill?.name) {
          skillNames.add(skillPosition.skill.name);
        }
      }
    }
  }

  return [...skillNames].sort((left, right) => left.localeCompare(right));
}

export function renderResumeMarkdown(resume: ResumeWithMarkdownRelations) {
  const lines: string[] = [];

  if (resume.contactInfo?.name) {
    lines.push(`# ${resume.contactInfo.name}`);
  } else {
    lines.push(`# ${resume.name}`);
  }

  const contactDetails = [
    resume.contactInfo?.email,
    resume.contactInfo?.phone,
  ].filter(Boolean);
  if (contactDetails.length > 0) {
    lines.push(contactDetails.join(" | "));
  }

  const linkedJob = resume.Job?.title ?? resume.Job?.company;
  if (linkedJob) {
    lines.push(`Target role: ${linkedJob}`);
  }

  const summary = normalizeMarkdownBlock(resume.summary);
  if (summary) {
    lines.push("", "## Summary", "", summary);
  }

  if (resume.experience.length > 0) {
    lines.push("", "## Experience");

    for (const experience of resume.experience) {
      lines.push(
        "",
        `### ${formatMarkdownLink(experience.companyName, experience.link)}`,
      );

      for (const position of experience.positions) {
        lines.push(
          "",
          `**${position.title}**`,
          `${position.location} | ${formatDateRange(position.startDate, position.endDate)}`,
        );

        const accomplishments = normalizeMarkdownBlock(
          position.accomplishments,
        );
        if (accomplishments) {
          lines.push("", accomplishments);
        }
      }
    }
  }

  const education = resume.education.filter(
    (entry) => entry.type === EducationType.EDUCATION,
  );
  if (education.length > 0) {
    lines.push("", "## Education");

    for (const entry of education) {
      lines.push(
        "",
        `### ${formatMarkdownLink(entry.institution, entry.link)}`,
        `${entry.distinction}`,
        `${entry.location} | ${formatDateRange(entry.startDate, entry.endDate)}`,
      );

      const notes = normalizeMarkdownBlock(entry.notes);
      if (notes) {
        lines.push("", notes);
      }
    }
  }

  const certifications = resume.education.filter(
    (entry) => entry.type === EducationType.CERTIFICATION,
  );
  if (certifications.length > 0) {
    lines.push("", "## Certifications");

    for (const entry of certifications) {
      lines.push(
        "",
        `### ${formatMarkdownLink(entry.institution, entry.link)}`,
        `${entry.distinction}`,
        `${entry.location} | ${formatDateRange(entry.startDate, entry.endDate)}`,
      );

      const notes = normalizeMarkdownBlock(entry.notes);
      if (notes) {
        lines.push("", notes);
      }
    }
  }

  const shouldRenderSkills =
    resume.sections.some((section) => section.type === "SKILLS_SUMMARY") ||
    resume.experience.some((experience) =>
      experience.positions.some(
        (position) => (position.skillPosition?.length ?? 0) > 0,
      ),
    );
  const skills = collectResumeSkills(resume);
  if (shouldRenderSkills && skills.length > 0) {
    lines.push("", "## Skills", "", skills.join(", "));
  }

  return `${lines.join("\n").trim()}\n`;
}

// ============================================================================
// Business Logic Functions
// ============================================================================

/**
 * Create a new resume
 */
export async function createResume(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof createResumeSchema>,
) {
  // Validate jobId if provided
  if (input.jobId) {
    const job = await db.job.findFirst({
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
    const contactInfo = await db.contactInfo.create({
      data: {
        email: input.contactInfo.email,
        name: input.contactInfo.name,
        phone: input.contactInfo.phone,
      },
    });
    contactInfoId = contactInfo.id;
  }

  const resume = await db.resume.create({
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
              accomplishments: pos.accomplishments,
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
      summary: input.professionalSummary,
      userId: userId,
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
}

/**
 * Delete a resume
 */
export async function deleteResume(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof deleteResumeSchema>,
) {
  // Verify ownership
  const existing = await db.resume.findFirst({
    where: {
      id: input.id,
      userId: userId,
    },
  });

  if (!existing) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Resume not found",
    });
  }

  await db.resume.delete({
    where: { id: input.id },
  });

  return { success: true };
}

/**
 * Duplicate resume (useful for creating job-specific versions)
 */
export async function duplicateResume(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof duplicateResumeSchema>,
) {
  // Validate jobId if provided
  if (input.jobId) {
    const job = await db.job.findFirst({
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

  const original = await db.resume.findFirst({
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
      userId: userId,
    },
  });

  if (!original) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Resume not found",
    });
  }

  // Create duplicate
  const duplicate = await db.resume.create({
    data: {
      name: input.name ?? `${original.name} (Copy)`,
      user: {
        connect: { id: userId },
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

  return duplicate;
}

/**
 * Get resume by ID
 */
export async function getResume(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof getResumeSchema>,
) {
  const resume = await db.resume.findFirst({
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
      sections: true,
    },
    where: {
      id: input.id,
      userId: userId,
    },
  });

  if (!resume) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Resume not found",
    });
  }

  return resume;
}

export async function getResumeMarkdown(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof getResumeMarkdownSchema>,
) {
  const resume = await getResume(db, userId, input);
  return renderResumeMarkdown(resume);
}

/**
 * List all resumes for the current user
 */
export async function listResumes(
  db: PrismaClient,
  userId: string,
  input?: z.infer<typeof listResumesSchema>,
) {
  const resumes = await db.resume.findMany({
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
      userId: userId,
      ...(input?.jobId ? { jobId: input.jobId } : {}),
    },
  });

  return resumes;
}

/**
 * Update resume
 */
export async function updateResume(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof updateResumeSchema>,
) {
  // Verify ownership
  const existing = await db.resume.findFirst({
    where: {
      id: input.id,
      userId: userId,
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
      await db.contactInfo.update({
        data: {
          email: input.contactInfo.email,
          name: input.contactInfo.name,
          phone: input.contactInfo.phone,
        },
        where: { id: existing.contactInfoId },
      });
    } else {
      // Create new contact info and connect to resume
      const newContactInfo = await db.contactInfo.create({
        data: {
          email: input.contactInfo.email,
          name: input.contactInfo.name,
          phone: input.contactInfo.phone,
        },
      });
      await db.resume.update({
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
    await db.experience.deleteMany({
      where: { resumeId: input.id },
    });

    // Create new experiences
    await db.experience.createMany({
      data: input.experience.map((exp) => ({
        companyName: exp.companyName,
        link: exp.link,
        resumeId: input.id,
      })),
    });

    // Get created experiences and add positions
    const experiences = await db.experience.findMany({
      where: { resumeId: input.id },
    });

    for (let i = 0; i < input.experience.length; i++) {
      const exp = input.experience[i];
      const dbExp = experiences[i];
      if (exp && dbExp) {
        await db.position.createMany({
          data: exp.positions.map((pos) => ({
            accomplishments: pos.accomplishments,
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
    await db.education.deleteMany({
      where: { resumeId: input.id },
    });

    // Create new education
    await db.education.createMany({
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
  const updated = await db.resume.update({
    data: {
      ...(input.name && { name: input.name }),
      ...(input.professionalSummary && {
        summary: input.professionalSummary,
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

  return updated;
}

// ============================================================================
// Agent-specific Business Logic Functions
// ============================================================================

/**
 * Create a working copy of a resume for editing (used by agent)
 */
export async function createResumeCopy(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof createResumeCopySchema>,
) {
  const sourceResume = await db.resume.findFirst({
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
      sections: true,
    },
    where: {
      id: input.sourceResumeId,
      userId,
    },
  });

  if (!sourceResume) {
    throw new Error("Source resume not found");
  }

  // Create a new resume copy with a unique name
  const timestamp = Date.now();
  const copyName =
    input.name?.trim() || `${sourceResume.name} - Copy ${timestamp}`;

  const newResume = await db.resume.create({
    data: {
      ...(sourceResume.contactInfo && {
        contactInfo: {
          create: {
            email: sourceResume.contactInfo.email,
            name: sourceResume.contactInfo.name,
            phone: sourceResume.contactInfo.phone,
          },
        },
      }),
      education: {
        create: sourceResume.education.map((edu) => ({
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
        create: sourceResume.experience.map((exp) => ({
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
      ...(sourceResume.jobId && {
        Job: {
          connect: { id: sourceResume.jobId },
        },
      }),
      name: copyName,
      sections: {
        create: sourceResume.sections.map((section) => ({
          title: section.title,
          type: section.type,
        })),
      },
      summary: sourceResume.summary,
      user: {
        connect: { id: userId },
      },
    },
  });

  return {
    name: newResume.name,
    resumeId: newResume.id,
    success: true,
  };
}

/**
 * Update accomplishments for a specific position (used by agent)
 */
export async function updateAccomplishments(
  db: PrismaClient,
  input: z.infer<typeof updateAccomplishmentsSchema>,
) {
  const position = await db.position.update({
    data: {
      accomplishments: input.accomplishments,
    },
    where: { id: input.positionId },
  });

  return {
    positionId: position.id,
    success: true,
    title: position.title,
  };
}

/**
 * Update the professional summary (used by agent)
 */
export async function updateSummary(
  db: PrismaClient,
  input: z.infer<typeof updateSummarySchema>,
) {
  const resume = await db.resume.update({
    data: { summary: input.summary },
    where: { id: input.resumeId },
  });

  return {
    resumeId: resume.id,
    success: true,
  };
}

/**
 * Add new work experience to resume (used by agent)
 */
export async function addExperience(
  db: PrismaClient,
  input: z.infer<typeof addExperienceSchema>,
) {
  const resume = await db.resume.findUnique({
    include: { experience: true },
    where: { id: input.resumeId },
  });

  if (!resume) {
    throw new Error("Resume not found");
  }

  // Check if experience for this company already exists
  const existingExperience = resume.experience.find(
    (exp) => exp.companyName === input.companyName,
  );

  if (existingExperience) {
    // Add position to existing experience
    await db.position.create({
      data: {
        accomplishments: input.accomplishments,
        endDate: input.endDate ? new Date(input.endDate) : null,
        experienceId: existingExperience.id,
        location: input.location,
        startDate: new Date(input.startDate),
        title: input.title,
      },
    });
  } else {
    // Create new experience with position
    await db.experience.create({
      data: {
        companyName: input.companyName,
        link: null,
        positions: {
          create: {
            accomplishments: input.accomplishments,
            endDate: input.endDate ? new Date(input.endDate) : null,
            location: input.location,
            startDate: new Date(input.startDate),
            title: input.title,
          },
        },
        resumeId: input.resumeId,
      },
    });
  }

  return {
    message: `Added ${input.title} at ${input.companyName}`,
    success: true,
  };
}

/**
 * Update skills for a position (used by agent)
 */
export async function updateSkills(
  db: PrismaClient,
  input: z.infer<typeof updateSkillsSchema>,
) {
  // Remove existing skills
  await db.positionSkill.deleteMany({
    where: { positionId: input.positionId },
  });

  // Add new skills
  for (const skillName of input.skills) {
    // Find or create skill
    let skill = await db.skill.findUnique({
      where: { name: skillName },
    });

    if (!skill) {
      skill = await db.skill.create({
        data: { name: skillName },
      });
    }

    // Link skill to position
    await db.positionSkill.create({
      data: {
        positionId: input.positionId,
        skillId: skill.id,
      },
    });
  }

  return {
    positionId: input.positionId,
    skills: input.skills,
    success: true,
  };
}
