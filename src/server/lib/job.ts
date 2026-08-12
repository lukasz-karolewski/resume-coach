"server-only";

import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import type { PrismaClient } from "~/generated/prisma/client";
import {
  addJobSchema,
  updateJobSchema,
  updateJobStatusSchema,
} from "~/lib/schemas/job";

// ============================================================================
// Zod Schemas
// ============================================================================

export const fetchJobDescriptionSchema = z.object({
  url: z.url(),
});

export { addJobSchema, updateJobSchema, updateJobStatusSchema };

// ============================================================================
// Business Logic Functions
// ============================================================================

/**
 * Add a new job
 */
export async function addJob(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof addJobSchema>,
) {
  return db.$transaction(async (transaction) => {
    if (input.resumeId) {
      await requireOwnedResume(transaction, userId, input.resumeId);
    }

    const job = await transaction.job.create({
      data: {
        company: input.company,
        location: optionalText(input.location),
        nextActionAt: input.nextActionAt,
        notes: optionalText(input.notes),
        status: input.status,
        title: input.title,
        url: input.url,
        userId,
      },
    });

    if (input.resumeId) {
      await transaction.resume.update({
        data: { jobId: job.id },
        where: { id: input.resumeId },
      });
    }

    return job;
  });
}

export async function updateJob(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof updateJobSchema>,
) {
  return db.$transaction(async (transaction) => {
    await requireOwnedJob(transaction, userId, input.id);

    if (input.resumeId) {
      await requireOwnedResume(transaction, userId, input.resumeId);
    }

    const job = await transaction.job.update({
      data: {
        company: input.company,
        location: optionalText(input.location),
        nextActionAt: input.nextActionAt,
        notes: optionalText(input.notes),
        status: input.status,
        title: input.title,
        url: input.url,
      },
      where: { id: input.id },
    });

    if (input.resumeId !== undefined) {
      await transaction.resume.updateMany({
        data: { jobId: null },
        where: { jobId: input.id, userId },
      });

      if (input.resumeId) {
        await transaction.resume.update({
          data: { jobId: input.id },
          where: { id: input.resumeId },
        });
      }
    }

    return job;
  });
}

export async function updateJobStatus(
  db: PrismaClient,
  userId: string,
  input: z.infer<typeof updateJobStatusSchema>,
) {
  await requireOwnedJob(db, userId, input.id);

  return db.job.update({
    data: { status: input.status },
    where: { id: input.id },
  });
}

/**
 * Get all jobs for a user
 */
export async function getJobs(db: PrismaClient, userId: string) {
  const jobs = await db.job.findMany({
    include: {
      resume: {
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true },
      },
    },
    orderBy: [
      { nextActionAt: { nulls: "last", sort: "asc" } },
      { createdAt: "desc" },
    ],
    where: { userId },
  });

  return jobs;
}

function optionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

async function requireOwnedJob(
  db: Pick<PrismaClient, "job">,
  userId: string,
  jobId: string,
) {
  const job = await db.job.findFirst({
    select: { id: true },
    where: { id: jobId, userId },
  });

  if (!job) {
    throw new Error("Job not found or does not belong to user");
  }

  return job;
}

async function requireOwnedResume(
  db: Pick<PrismaClient, "resume">,
  userId: string,
  resumeId: number,
) {
  const resume = await db.resume.findFirst({
    select: { id: true },
    where: { id: resumeId, userId },
  });

  if (!resume) {
    throw new Error("Resume not found or does not belong to user");
  }

  return resume;
}

/**
 * Fetch and parse job description from URL using LLM (used by agent)
 */
export async function fetchJobDescription(
  input: z.infer<typeof fetchJobDescriptionSchema>,
) {
  // Fetch the page content
  const response = await fetch(input.url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch URL: ${response.status} ${response.statusText}`,
    );
  }

  const html = await response.text();

  // Use LLM to extract job information
  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0,
  });

  const extractionPrompt = `Extract job posting information from the following HTML content. 
Return a JSON object with these fields:
- company: Company name
- title: Job title
- location: Job location
- requirements: Array of key requirements/qualifications
- responsibilities: Array of main responsibilities
- description: Brief job description

HTML Content:
${html.substring(0, 15000)}

Return ONLY valid JSON, no other text.`;

  const result = await llm.invoke(extractionPrompt);
  const content = result.content as string;

  // Try to parse the JSON response
  try {
    const jobData = JSON.parse(content);
    return {
      job: jobData,
      success: true,
    };
  } catch {
    // If LLM didn't return pure JSON, try to extract it
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jobData = JSON.parse(jsonMatch[0]);
      return {
        job: jobData,
        success: true,
      };
    }
    throw new Error("Failed to parse LLM response");
  }
}
