"server-only";

import { TRPCError } from "@trpc/server";
import type { z } from "zod";
import {
  EducationType,
  type Prisma,
  type PrismaClient,
} from "~/generated/prisma/client";
import { getResumeSectionLabel } from "~/lib/resume-sections";
import {
  type addExperienceSchema,
  type createResumeCopySchema,
  type createResumeSchema,
  createTailoredResumeFromProfileSchema,
  type deleteResumeSchema,
  type duplicateResumeSchema,
  type getResumeMarkdownSchema,
  type getResumeSchema,
  type listResumesSchema,
  type updateAccomplishmentsSchema,
  type updateResumeSchema,
  type updateResumeTitleSchema,
  type updateSkillsSchema,
  type updateSummarySchema,
} from "~/lib/schemas/resume";
import { RESUME_ID_LENGTH } from "~/lib/schemas/resume-identifiers";
import type {
  addResumeSectionItemSchema,
  deleteResumeSectionItemSchema,
  ResumeSectionItem,
  removeResumeSectionSchema,
  updateResumeSectionItemSchema,
} from "~/lib/schemas/resume-section-item";
import { generateBase62Id } from "~/server/lib/base62";
import { getAccomplishmentProfile } from "~/server/lib/profile";
import { isUniqueConstraintError } from "~/server/utils";

type ResumeWithMarkdownRelations = Awaited<ReturnType<typeof getResume>>;

const RESUME_ID_CREATE_ATTEMPTS = 5;

export async function createResumeWithGeneratedId<T>(
  create: (id: string) => Promise<T>,
) {
  for (let attempt = 0; attempt < RESUME_ID_CREATE_ATTEMPTS; attempt += 1) {
    try {
      return await create(generateBase62Id(RESUME_ID_LENGTH));
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }
  }

  throw new Error("Unable to allocate a unique resume ID");
}

const MATCH_STOP_WORDS = new Set([
  "about",
  "across",
  "after",
  "also",
  "and",
  "are",
  "build",
  "built",
  "from",
  "have",
  "into",
  "looking",
  "that",
  "their",
  "them",
  "this",
  "through",
  "with",
  "work",
]);

type ProfileRoleForTailoring = NonNullable<
  Awaited<ReturnType<typeof getAccomplishmentProfile>>
>["roles"][number];

type ProfileEntryForTailoring = ProfileRoleForTailoring["entries"][number];

type TailoredEntryMatch = {
  entry: ProfileEntryForTailoring;
  role: ProfileRoleForTailoring;
  score: number;
};

export async function requireOwnedResume(
  db: PrismaClient,
  userId: string,
  resumeId: string,
) {
  const resume = await db.resume.findFirst({
    select: {
      id: true,
    },
    where: {
      id: resumeId,
      userId,
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

async function requireOwnedPosition(
  db: PrismaClient,
  userId: string,
  positionId: number,
) {
  const position = await db.position.findFirst({
    select: {
      id: true,
      title: true,
    },
    where: {
      experience: {
        resume: {
          userId,
        },
      },
      id: positionId,
    },
  });

  if (!position) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Position not found",
    });
  }

  return position;
}

function formatDateRange(startDate: Date, endDate?: Date | null) {
  const start = startDate.toLocaleDateString("en-US", {
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  });
  const end = endDate
    ? endDate.toLocaleDateString("en-US", {
        month: "short",
        timeZone: "UTC",
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

function tokenizeForMatching(...values: Array<string | null | undefined>) {
  const tokens = new Set<string>();

  for (const value of values) {
    if (!value) {
      continue;
    }

    const normalizedValue = value.toLowerCase().replace(/[^a-z0-9+#]+/g, " ");

    for (const token of normalizedValue.split(/\s+/)) {
      if (token.length < 3 || MATCH_STOP_WORDS.has(token)) {
        continue;
      }

      tokens.add(token);

      if (token.endsWith("s") && token.length > 4) {
        tokens.add(token.slice(0, -1));
      }
    }
  }

  return tokens;
}

function scoreProfileEntryAgainstJob(
  role: ProfileRoleForTailoring,
  entry: ProfileEntryForTailoring,
  jobKeywords: Set<string>,
) {
  const entryKeywords = tokenizeForMatching(
    role.companyName,
    role.title,
    role.location,
    entry.content,
  );

  let score = 0;

  for (const keyword of entryKeywords) {
    if (jobKeywords.has(keyword)) {
      score += role.title.toLowerCase().includes(keyword) ? 3 : 1;
    }
  }

  return score;
}

function selectTailoredEntries(
  roles: ProfileRoleForTailoring[],
  jobKeywords: Set<string>,
) {
  const matches: TailoredEntryMatch[] = [];

  for (const role of roles) {
    for (const entry of role.entries) {
      matches.push({
        entry,
        role,
        score: scoreProfileEntryAgainstJob(role, entry, jobKeywords),
      });
    }
  }

  const rankedMatches = [...matches].sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    if (left.role.sortOrder !== right.role.sortOrder) {
      return left.role.sortOrder - right.role.sortOrder;
    }

    return left.entry.sortOrder - right.entry.sortOrder;
  });

  const selectedMatches = rankedMatches.some((match) => match.score > 0)
    ? rankedMatches.filter((match) => match.score > 0).slice(0, 6)
    : rankedMatches.slice(0, 4);

  const groupedMatches = new Map<
    number,
    {
      role: ProfileRoleForTailoring;
      entries: ProfileEntryForTailoring[];
    }
  >();

  for (const match of selectedMatches) {
    const current = groupedMatches.get(match.role.id);

    if (current) {
      current.entries.push(match.entry);
      continue;
    }

    groupedMatches.set(match.role.id, {
      entries: [match.entry],
      role: match.role,
    });
  }

  return [...groupedMatches.values()]
    .map((group) => ({
      ...group,
      entries: group.entries
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .slice(0, 3),
    }))
    .filter((group) => group.entries.length > 0)
    .filter((group) => group.role.startDate || group.role.endDate);
}

function buildTailoredResumeName(job: {
  company?: string | null;
  title?: string | null;
}) {
  if (job.title) {
    return `${job.title} Resume`;
  }

  if (job.company) {
    return `${job.company} Resume`;
  }

  return "Tailored Resume";
}

function buildTailoredSummary(
  job: {
    company?: string | null;
    title?: string | null;
  },
  selectedRoles: Array<{
    role: Pick<ProfileRoleForTailoring, "companyName" | "title">;
  }>,
  totalEntries: number,
) {
  const targetRole = job.title ?? "this role";
  const sourceRoles = selectedRoles
    .slice(0, 2)
    .map(({ role }) => `${role.title} at ${role.companyName}`);

  const summaryParts = [
    `Tailored for ${targetRole} using ${totalEntries} verified accomplishment${totalEntries === 1 ? "" : "s"} from your profile.`,
  ];

  if (sourceRoles.length > 0) {
    summaryParts.push(
      `Most relevant source roles: ${sourceRoles.join(" and ")}.`,
    );
  }

  if (job.company) {
    summaryParts.push(
      `Review and refine this draft before sending it to ${job.company}.`,
    );
  }

  return summaryParts.join(" ");
}

function formatTailoredAccomplishments(
  role: Pick<ProfileRoleForTailoring, "companyName" | "title">,
  entries: ProfileEntryForTailoring[],
) {
  return entries
    .map(
      (entry, index) =>
        `- ${entry.content}\n  _Source: accomplishment profile -> ${role.companyName} / ${role.title} / item ${index + 1}_`,
    )
    .join("\n\n");
}

function collectResumeSkills(resume: ResumeWithMarkdownRelations) {
  const skillNames = new Set<string>();

  for (const resumeSkill of resume.skills) {
    skillNames.add(resumeSkill.skill.name);
  }

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
    resume.skills.length > 0 ||
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

  if (resume.patents.length > 0) {
    lines.push("", "## Patents");

    for (const patent of resume.patents) {
      lines.push(
        "",
        `### ${formatMarkdownLink(patent.title, patent.link)}`,
        patent.date.toLocaleDateString("en-US", {
          month: "short",
          timeZone: "UTC",
          year: "numeric",
        }),
        "",
        patent.description,
      );
    }
  }

  return `${lines.join("\n").trim()}\n`;
}

// ============================================================================
// Business Logic Functions
// ============================================================================

function parseResumeMonth(value: string) {
  return new Date(`${value}-01T00:00:00.000Z`);
}

async function ensureResumeSection(
  db: Prisma.TransactionClient,
  resumeId: string,
  type: ResumeSectionItem["type"],
) {
  const section = await db.section.findFirst({
    select: { id: true },
    where: { resumeId, type },
  });

  if (!section) {
    await db.section.create({
      data: {
        resumeId,
        title: getResumeSectionLabel(type),
        type,
      },
    });
  }
}

export async function addResumeSectionItem(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof addResumeSectionItemSchema>,
) {
  await requireOwnedResume(db, userId, input.resumeId);

  await db.$transaction(async (transaction) => {
    await ensureResumeSection(transaction, input.resumeId, input.type);

    if (input.type === "EXPERIENCE") {
      const experience = await transaction.experience.findFirst({
        select: { id: true },
        where: {
          companyName: input.companyName,
          resumeId: input.resumeId,
        },
      });
      const position = {
        accomplishments: input.accomplishments,
        endDate: input.endDate ? parseResumeMonth(input.endDate) : null,
        location: input.location,
        startDate: parseResumeMonth(input.startDate),
        title: input.roleTitle,
      };

      if (experience) {
        await transaction.position.create({
          data: { ...position, experienceId: experience.id },
        });
      } else {
        await transaction.experience.create({
          data: {
            companyName: input.companyName,
            positions: { create: position },
            resumeId: input.resumeId,
          },
        });
      }
      return;
    }

    if (input.type === "EDUCATION" || input.type === "CERTIFICATION") {
      await transaction.education.create({
        data: {
          distinction: input.distinction,
          endDate: parseResumeMonth(input.endDate),
          institution: input.institution,
          link: input.link ?? "",
          location: input.location,
          notes: input.notes,
          resumeId: input.resumeId,
          startDate: parseResumeMonth(
            input.type === "CERTIFICATION" ? input.endDate : input.startDate,
          ),
          type: input.type,
        },
      });
      return;
    }

    if (input.type === "SKILLS_SUMMARY") {
      const skill = await transaction.skill.upsert({
        create: { name: input.name },
        update: {},
        where: { name: input.name },
      });
      const existingSkill = await transaction.resumeSkill.findFirst({
        select: { id: true },
        where: { resumeId: input.resumeId, skillId: skill.id },
      });

      if (existingSkill) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "That skill is already on this resume",
        });
      }

      await transaction.resumeSkill.create({
        data: { resumeId: input.resumeId, skillId: skill.id },
      });
      return;
    }

    await transaction.patent.create({
      data: {
        date: parseResumeMonth(input.date),
        description: input.description,
        link: input.link ?? null,
        resumeId: input.resumeId,
        title: input.title,
      },
    });
  });

  return getResume(db, userId, { id: input.resumeId });
}

async function requireOwnedSectionItem(
  transaction: Prisma.TransactionClient,
  input: z.infer<typeof deleteResumeSectionItemSchema>,
): Promise<
  | { experienceId: number; kind: "EXPERIENCE"; positionCount: number }
  | { kind: "ITEM" }
> {
  if (input.type === "EXPERIENCE") {
    const position = await transaction.position.findFirst({
      select: {
        experience: {
          select: {
            _count: { select: { positions: true } },
            id: true,
          },
        },
        id: true,
      },
      where: {
        experience: { resumeId: input.resumeId },
        id: input.itemId,
      },
    });
    if (position?.experience) {
      return {
        experienceId: position.experience.id,
        kind: "EXPERIENCE",
        positionCount: position.experience._count.positions,
      };
    }
  } else if (input.type === "EDUCATION" || input.type === "CERTIFICATION") {
    const education = await transaction.education.findFirst({
      select: { id: true },
      where: {
        id: input.itemId,
        resumeId: input.resumeId,
        type: input.type,
      },
    });
    if (education) return { kind: "ITEM" };
  } else if (input.type === "SKILLS_SUMMARY") {
    const skill = await transaction.resumeSkill.findFirst({
      select: { id: true },
      where: { id: input.itemId, resumeId: input.resumeId },
    });
    if (skill) return { kind: "ITEM" };
  } else {
    const patent = await transaction.patent.findFirst({
      select: { id: true },
      where: { id: input.itemId, resumeId: input.resumeId },
    });
    if (patent) return { kind: "ITEM" };
  }

  throw new TRPCError({
    code: "NOT_FOUND",
    message: "Resume section item not found",
  });
}

export async function updateResumeSectionItem(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof updateResumeSectionItemSchema>,
) {
  await requireOwnedResume(db, userId, input.resumeId);

  await db.$transaction(async (transaction) => {
    const ownedItem = await requireOwnedSectionItem(transaction, input);

    if (input.type === "EXPERIENCE") {
      if (ownedItem.kind !== "EXPERIENCE") return;
      await transaction.experience.update({
        data: { companyName: input.companyName },
        where: { id: ownedItem.experienceId },
      });
      await transaction.position.update({
        data: {
          accomplishments: input.accomplishments,
          endDate: input.endDate ? parseResumeMonth(input.endDate) : null,
          location: input.location,
          startDate: parseResumeMonth(input.startDate),
          title: input.roleTitle,
        },
        where: { id: input.itemId },
      });
      return;
    }

    if (input.type === "EDUCATION" || input.type === "CERTIFICATION") {
      await transaction.education.update({
        data: {
          distinction: input.distinction,
          endDate: parseResumeMonth(input.endDate),
          institution: input.institution,
          link: input.link ?? "",
          location: input.location,
          notes: input.notes,
          startDate: parseResumeMonth(
            input.type === "CERTIFICATION" ? input.endDate : input.startDate,
          ),
        },
        where: { id: input.itemId },
      });
      return;
    }

    if (input.type === "SKILLS_SUMMARY") {
      const skill = await transaction.skill.upsert({
        create: { name: input.name },
        update: {},
        where: { name: input.name },
      });
      await transaction.resumeSkill.update({
        data: { skillId: skill.id },
        where: { id: input.itemId },
      });
      return;
    }

    await transaction.patent.update({
      data: {
        date: parseResumeMonth(input.date),
        description: input.description,
        link: input.link ?? null,
        title: input.title,
      },
      where: { id: input.itemId },
    });
  });

  return getResume(db, userId, { id: input.resumeId });
}

export async function deleteResumeSectionItem(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof deleteResumeSectionItemSchema>,
) {
  await requireOwnedResume(db, userId, input.resumeId);

  await db.$transaction(async (transaction) => {
    const ownedItem = await requireOwnedSectionItem(transaction, input);

    if (input.type === "EXPERIENCE") {
      if (ownedItem.kind !== "EXPERIENCE") return;
      await transaction.positionSkill.deleteMany({
        where: { positionId: input.itemId },
      });
      if (ownedItem.positionCount === 1) {
        await transaction.experience.delete({
          where: { id: ownedItem.experienceId },
        });
      } else {
        await transaction.position.delete({ where: { id: input.itemId } });
      }
    } else if (input.type === "EDUCATION" || input.type === "CERTIFICATION") {
      await transaction.education.delete({ where: { id: input.itemId } });
    } else if (input.type === "SKILLS_SUMMARY") {
      await transaction.resumeSkill.delete({ where: { id: input.itemId } });
    } else {
      await transaction.patent.delete({ where: { id: input.itemId } });
    }
  });

  return getResume(db, userId, { id: input.resumeId });
}

export async function removeResumeSection(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof removeResumeSectionSchema>,
) {
  await requireOwnedResume(db, userId, input.resumeId);

  await db.$transaction(async (transaction) => {
    if (input.type === "EXPERIENCE") {
      await transaction.positionSkill.deleteMany({
        where: { position: { experience: { resumeId: input.resumeId } } },
      });
      await transaction.experience.deleteMany({
        where: { resumeId: input.resumeId },
      });
    } else if (input.type === "EDUCATION" || input.type === "CERTIFICATION") {
      await transaction.education.deleteMany({
        where: { resumeId: input.resumeId, type: input.type },
      });
    } else if (input.type === "SKILLS_SUMMARY") {
      await transaction.resumeSkill.deleteMany({
        where: { resumeId: input.resumeId },
      });
      await transaction.positionSkill.deleteMany({
        where: { position: { experience: { resumeId: input.resumeId } } },
      });
    } else {
      await transaction.patent.deleteMany({
        where: { resumeId: input.resumeId },
      });
    }

    await transaction.section.deleteMany({
      where: { resumeId: input.resumeId, type: input.type },
    });
  });

  return getResume(db, userId, { id: input.resumeId });
}

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

  const resume = await createResumeWithGeneratedId((id) =>
    db.resume.create({
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
        id,
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
    }),
  );

  return resume;
}

export async function createTailoredResumeFromProfile(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof createTailoredResumeFromProfileSchema>,
) {
  const parsedInput = createTailoredResumeFromProfileSchema.parse(input);

  const job = await db.job.findFirst({
    where: {
      id: parsedInput.jobId,
      userId,
    },
  });

  if (!job) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Job not found or does not belong to user",
    });
  }

  const accomplishmentProfile = await getAccomplishmentProfile(db, userId);

  if (!accomplishmentProfile || accomplishmentProfile.roles.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Add accomplishments to your profile before generating a resume",
    });
  }

  const selectedRoles = selectTailoredEntries(
    accomplishmentProfile.roles,
    tokenizeForMatching(
      job.title,
      job.company,
      job.description,
      job.notes,
      job.url,
    ),
  );

  if (selectedRoles.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Add at least one dated role to your profile before generating a resume",
    });
  }

  const baseResume = await db.resume.findFirst({
    include: {
      contactInfo: true,
      education: true,
    },
    orderBy: [{ jobId: "asc" }, { updatedAt: "desc" }],
    where: {
      userId,
    },
  });

  return createResumeWithGeneratedId((id) =>
    db.resume.create({
      data: {
        id,
        ...(baseResume?.contactInfo
          ? {
              contactInfo: {
                create: {
                  email: baseResume.contactInfo.email,
                  name: baseResume.contactInfo.name,
                  phone: baseResume.contactInfo.phone,
                },
              },
            }
          : {}),
        education: {
          create:
            baseResume?.education.map((entry) => ({
              distinction: entry.distinction,
              endDate: entry.endDate,
              institution: entry.institution,
              link: entry.link,
              location: entry.location,
              notes: entry.notes,
              startDate: entry.startDate,
              type: entry.type,
            })) ?? [],
        },
        experience: {
          create: selectedRoles.map(({ role, entries }) => ({
            companyName: role.companyName,
            link: undefined,
            positions: {
              create: [
                {
                  accomplishments: formatTailoredAccomplishments(role, entries),
                  endDate: role.endDate,
                  location: role.location ?? "",
                  startDate: role.startDate ?? role.endDate ?? new Date(),
                  title: role.title,
                },
              ],
            },
          })),
        },
        Job: {
          connect: { id: job.id },
        },
        name: parsedInput.name || buildTailoredResumeName(job),
        summary: buildTailoredSummary(
          job,
          selectedRoles,
          selectedRoles.reduce(
            (total, currentRole) => total + currentRole.entries.length,
            0,
          ),
        ),
        user: {
          connect: { id: userId },
        },
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
    }),
  );
}

/**
 * Delete a resume
 */
export async function deleteResume(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof deleteResumeSchema>,
) {
  const existing = await db.resume.findFirst({
    select: {
      contactInfoId: true,
      id: true,
    },
    where: {
      id: input.id,
      userId,
    },
  });

  if (!existing) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Resume not found",
    });
  }

  await db.$transaction(async (transaction) => {
    await transaction.positionSkill.deleteMany({
      where: {
        position: {
          experience: {
            resumeId: existing.id,
          },
        },
      },
    });
    await transaction.section.deleteMany({
      where: { resumeId: existing.id },
    });
    await transaction.resume.delete({
      where: { id: existing.id },
    });

    if (existing.contactInfoId) {
      await transaction.contactInfo.deleteMany({
        where: {
          id: existing.contactInfoId,
          resumes: { none: {} },
        },
      });
    }
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
      patents: true,
      sections: true,
      skills: true,
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
  const duplicate = await createResumeWithGeneratedId((id) =>
    db.resume.create({
      data: {
        id,
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
        patents: {
          create: original.patents.map((patent) => ({
            date: patent.date,
            description: patent.description,
            link: patent.link,
            title: patent.title,
          })),
        },
        sections: {
          create: original.sections.map((section) => ({
            title: section.title,
            type: section.type,
          })),
        },
        skills: {
          create: original.skills.map((resumeSkill) => ({
            skill: { connect: { id: resumeSkill.skillId } },
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
        patents: true,
        sections: true,
        skills: {
          include: { skill: true },
        },
      },
    }),
  );

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
            orderBy: {
              startDate: "desc",
            },
          },
        },
      },
      Job: true,
      patents: {
        orderBy: { date: "desc" },
      },
      permalink: true,
      sections: true,
      skills: {
        include: { skill: true },
      },
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
  const orderBy =
    input?.sort === "name"
      ? { name: "asc" as const }
      : input?.sort === "created"
        ? { createdAt: "desc" as const }
        : { updatedAt: "desc" as const };

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
    orderBy,
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

export async function updateResumeTitle(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof updateResumeTitleSchema>,
) {
  const existing = await db.resume.findFirst({
    where: {
      id: input.id,
      userId,
    },
  });

  if (!existing) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Resume not found",
    });
  }

  return db.resume.update({
    data: {
      name: input.name,
    },
    where: {
      id: input.id,
    },
  });
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
      patents: true,
      sections: true,
      skills: true,
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

  const newResume = await createResumeWithGeneratedId((id) =>
    db.resume.create({
      data: {
        id,
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
        patents: {
          create: sourceResume.patents.map((patent) => ({
            date: patent.date,
            description: patent.description,
            link: patent.link,
            title: patent.title,
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
        skills: {
          create: sourceResume.skills.map((resumeSkill) => ({
            skill: { connect: { id: resumeSkill.skillId } },
          })),
        },
        summary: sourceResume.summary,
        user: {
          connect: { id: userId },
        },
      },
    }),
  );

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
  userId: string,
  input: z.infer<typeof updateAccomplishmentsSchema>,
) {
  await requireOwnedPosition(db, userId, input.positionId);

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
  userId: string,
  input: z.infer<typeof updateSummarySchema>,
) {
  await requireOwnedResume(db, userId, input.resumeId);

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
  userId: string,
  input: z.infer<typeof addExperienceSchema>,
) {
  const resume = await db.resume.findFirst({
    include: { experience: true },
    where: {
      id: input.resumeId,
      userId,
    },
  });

  if (!resume) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Resume not found",
    });
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
  userId: string,
  input: z.infer<typeof updateSkillsSchema>,
) {
  await requireOwnedPosition(db, userId, input.positionId);

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
