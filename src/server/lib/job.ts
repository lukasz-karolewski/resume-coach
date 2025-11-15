"server-only";

import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import type { PrismaClient } from "~/generated/prisma/client";

// ============================================================================
// Zod Schemas
// ============================================================================

export const addJobSchema = z.object({
  url: z.url(),
});

export const fetchJobDescriptionSchema = z.object({
  url: z.url(),
});

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
  await db.job.create({
    data: {
      url: input.url,
      userId: userId,
    },
  });

  // TODO
  // scrape the job details
  // sent push notification it's done

  // const details = await extractJobDetails(input.url);

  // await db.job.update({
  //   where: {
  //     id: job.id,
  //   },
  //   data: {
  //     title: details.title,
  //     description: details.description,
  //     company: details.companyName,
  //   },
  // });

  return "job added";
}

/**
 * Get all jobs for a user
 */
export async function getJobs(db: PrismaClient, userId: string) {
  const jobs = await db.job.findMany({
    where: { userId },
  });

  return jobs;
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
