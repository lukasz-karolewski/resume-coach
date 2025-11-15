"server-only";

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { EducationType, type PrismaClient } from "~/generated/prisma/client";
import { mockDB } from "~/server/db-mock-data";

// ============================================================================
// Zod Schemas for CRUD Operations
// ============================================================================

export const positionSchema = z.object({
  accomplishments: z.array(z.string()),
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
  type: z.nativeEnum(EducationType),
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
  professionalSummary: z.array(z.string()).default([]),
});

export const updateResumeSchema = z.object({
  contactInfo: contactInfoSchema.optional(),
  education: z.array(educationSchema).optional(),
  experience: z.array(experienceSchema).optional(),
  id: z.number(),
  name: z.string().optional(),
  professionalSummary: z.array(z.string()).optional(),
});

export const duplicateResumeSchema = z.object({
  id: z.number(),
  jobId: z.string().optional(),
  name: z.string().optional(),
});

export const getResumeByIdSchema = z.object({ id: z.number() });

export const getResumeSchema = z.object({
  company_name: z.string(),
  version: z.string(),
});

export const listResumesSchema = z
  .object({
    jobId: z.string().optional(),
  })
  .optional();

export const deleteResumeSchema = z.object({ id: z.number() });

// Agent-specific schemas
export const createResumeCopySchema = z.object({
  sourceResumeId: z.number(),
});

export const updateAccomplishmentsSchema = z.object({
  accomplishments: z.array(z.string()),
  positionId: z.number(),
});

export const updateSummarySchema = z.object({
  resumeId: z.number(),
  summary: z.string(),
});

export const getResumeForAgentSchema = z.object({
  resumeId: z.number(),
});

export const addExperienceSchema = z.object({
  accomplishments: z.array(z.string()),
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
  console.log("DEBUG resume.create input:", JSON.stringify(input, null, 2));
  console.log("DEBUG userId:", userId);

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

  // Create resume with nested relations
  console.log("DEBUG creating resume with data:", {
    contactInfoId: contactInfoId ?? null,
    jobId: input.jobId ?? null,
    name: input.name,
    userId: userId,
  });

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

  // Get original resume
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

  return {
    ...duplicate,
    experience: duplicate.experience.map((exp) => ({
      ...exp,
      positions: exp.positions.map((pos) => ({
        ...pos,
        accomplishments: JSON.parse(pos.accomplishments as string) as string[],
      })),
    })),
    summary: JSON.parse(duplicate.summary) as string[],
  };
}

/**
 * Get resume by ID
 */
export async function getResumeById(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof getResumeByIdSchema>,
) {
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
}

/**
 * Get resume by company name and version
 */
export async function getResumeByCompanyName(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof getResumeSchema>,
) {
  // if id in mockDB, return else, query actual DB
  if (Object.keys(mockDB).includes(input.company_name.toLowerCase())) {
    return mockDB[input.company_name.toLowerCase()];
  }

  // Query actual DB if not in mockDB
  const resume = await db.resume.findFirst({
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
      userId: userId,
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
}

// ============================================================================
// Agent-specific Business Logic Functions
// ============================================================================

/**
 * Create a working copy of a resume for editing (used by agent)
 */
export async function createResumeCopy(
  db: PrismaClient,
  input: z.infer<typeof createResumeCopySchema>,
) {
  // Fetch the source resume with all relations
  const sourceResume = await db.resume.findUnique({
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
    where: { id: input.sourceResumeId },
  });

  if (!sourceResume) {
    throw new Error("Source resume not found");
  }

  // Create a new resume copy with a unique name
  const timestamp = Date.now();
  const copyName = `${sourceResume.name} - Copy ${timestamp}`;

  const newResume = await db.resume.create({
    data: {
      contactInfoId: sourceResume.contactInfoId,
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
      jobId: sourceResume.jobId,
      name: copyName,
      summary: sourceResume.summary,
      userId: sourceResume.userId,
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
      accomplishments: input.accomplishments.join("\n"),
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
 * Get resume details for viewing/editing by agent
 */
export async function getResumeForAgent(
  db: PrismaClient,
  input: z.infer<typeof getResumeForAgentSchema>,
) {
  const resume = await db.resume.findUnique({
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
    where: { id: input.resumeId },
  });

  if (!resume) {
    throw new Error("Resume not found");
  }

  return {
    resume: {
      contactInfo: resume.contactInfo,
      education: resume.education,
      experience: resume.experience,
      id: resume.id,
      name: resume.name,
      sections: resume.sections,
      summary: resume.summary,
    },
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
        accomplishments: JSON.stringify(input.accomplishments),
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
            accomplishments: JSON.stringify(input.accomplishments),
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

/**
 * List all resumes for the user (used by agent)
 */
export async function listResumesForUser(db: PrismaClient, userId: string) {
  const resumes = await db.resume.findMany({
    include: {
      Job: {
        select: {
          company: true,
          title: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
    where: {
      Job: {
        userId: userId,
      },
    },
  });

  // Also get base resumes (without jobId)
  const baseResumes = await db.resume.findMany({
    orderBy: {
      id: "desc",
    },
    where: {
      jobId: null,
    },
  });

  return {
    resumes: [
      ...baseResumes.map((r) => ({
        id: r.id,
        jobCompany: null,
        jobTitle: null,
        name: r.name,
      })),
      ...resumes.map((r) => ({
        id: r.id,
        jobCompany: r.Job?.company ?? null,
        jobTitle: r.Job?.title ?? null,
        name: r.name,
      })),
    ],
    success: true,
  };
}
