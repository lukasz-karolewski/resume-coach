"server-only";

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { db } from "~/server/db";
import {
  fetchJobDescription,
  fetchJobDescriptionSchema,
} from "~/server/lib/job";
import {
  addExperience,
  addExperienceSchema,
  createResumeCopy,
  createResumeCopySchema,
  getResumeForAgent,
  getResumeForAgentSchema,
  listResumesForUser,
  updateAccomplishments,
  updateAccomplishmentsSchema,
  updateSkills,
  updateSkillsSchema,
  updateSummary,
  updateSummarySchema,
} from "~/server/lib/resume";

/**
 * Tool: Create a working copy of a resume for editing
 */
export const createResumeCopyTool = tool(
  async ({ sourceResumeId }) => {
    try {
      const result = await createResumeCopy(db, { sourceResumeId });
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to create resume copy",
      });
    }
  },
  {
    description:
      "Create a working copy of a resume for editing. Returns the new resume ID.",
    name: "createResumeCopy",
    schema: createResumeCopySchema,
  },
);

/**
 * Tool: Update accomplishments for a specific position
 */
export const updateAccomplishmentsTool = tool(
  async ({ positionId, accomplishments }) => {
    try {
      const result = await updateAccomplishments(db, {
        accomplishments,
        positionId,
      });
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update accomplishments",
      });
    }
  },
  {
    description:
      "Update the accomplishments list for a specific position in the resume.",
    name: "updateAccomplishments",
    schema: updateAccomplishmentsSchema,
  },
);

/**
 * Tool: Update the professional summary
 */
export const updateSummaryTool = tool(
  async ({ resumeId, summary }) => {
    try {
      const result = await updateSummary(db, { resumeId, summary });
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to update summary",
      });
    }
  },
  {
    description: "Update the professional summary section of the resume.",
    name: "updateSummary",
    schema: updateSummarySchema,
  },
);

/**
 * Tool: Get resume details for viewing/editing
 */
export const getResumeTool = tool(
  async ({ resumeId }) => {
    try {
      const result = await getResumeForAgent(db, { resumeId });
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to fetch resume",
      });
    }
  },
  {
    description:
      "Fetch complete resume details including all sections, experience, and education.",
    name: "getResume",
    schema: getResumeForAgentSchema,
  },
);

/**
 * Tool: Add new work experience to resume
 */
export const addExperienceTool = tool(
  async ({
    resumeId,
    companyName,
    title,
    startDate,
    endDate,
    location,
    accomplishments,
  }) => {
    try {
      const result = await addExperience(db, {
        accomplishments,
        companyName,
        endDate,
        location,
        resumeId,
        startDate,
        title,
      });
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to add experience",
      });
    }
  },
  {
    description: "Add a new work experience/position to the resume.",
    name: "addExperience",
    schema: addExperienceSchema,
  },
);

/**
 * Tool: Update skills for a position
 */
export const updateSkillsTool = tool(
  async ({ positionId, skills }) => {
    try {
      const result = await updateSkills(db, { positionId, skills });
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to update skills",
      });
    }
  },
  {
    description: "Update the skills associated with a specific position.",
    name: "updateSkills",
    schema: updateSkillsSchema,
  },
);

/**
 * Subagent Tool: Fetch and parse job description from URL
 * Uses LLM to extract structured information from HTML
 */
export const fetchJobDescriptionTool = tool(
  async ({ url }) => {
    try {
      const result = await fetchJobDescription({ url });
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch job description",
      });
    }
  },
  {
    description:
      "Fetch and parse a job description from a URL. Extracts company, title, requirements, and responsibilities.",
    name: "fetchJobDescription",
    schema: fetchJobDescriptionSchema,
  },
);

/**
 * Tool: List all resumes for the user
 */
export const listResumesTool = tool(
  async ({ userId }) => {
    try {
      const result = await listResumesForUser(db, userId);
      return JSON.stringify(result);
    } catch (error) {
      return JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to list resumes",
      });
    }
  },
  {
    description:
      "List all available resumes for the user. Returns resume IDs and names.",
    name: "listResumes",
    schema: z.object({
      userId: z.string().describe("The user ID to list resumes for"),
    }),
  },
);

/**
 * Export all tools as an array
 */
export const allTools = [
  createResumeCopyTool,
  updateAccomplishmentsTool,
  updateSummaryTool,
  getResumeTool,
  addExperienceTool,
  updateSkillsTool,
  fetchJobDescriptionTool,
  listResumesTool,
];
