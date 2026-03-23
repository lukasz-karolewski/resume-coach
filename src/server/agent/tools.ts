"server-only";

import { type ToolRuntime, tool } from "@langchain/core/tools";
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
  getResume,
  listResumes,
  updateAccomplishments,
  updateAccomplishmentsSchema,
  updateSkills,
  updateSkillsSchema,
  updateSummary,
  updateSummarySchema,
} from "~/server/lib/resume";
import type { contextSchema, stateSchema } from "./graph";

// TODO https://docs.langchain.com/oss/javascript/langchain/tools#stream-writer

/**
 * Tool: Create a working copy of a resume for editing
 */
export const createResumeCopyTool = tool(
  async (
    { sourceResumeId },
    runtime: ToolRuntime<typeof stateSchema, typeof contextSchema>,
  ) => {
    try {
      const result = await createResumeCopy(db, runtime.context.userId, {
        sourceResumeId,
      });
      return result;
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create resume copy",
      };
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
      return result;
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update accomplishments",
      };
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
  async (
    { summary },
    runtime: ToolRuntime<typeof stateSchema, typeof contextSchema>,
  ) => {
    if (!runtime.context.currentResumeId) {
      return {
        error: "No Resume is being currently edited.",
      };
    }

    try {
      const result = await updateSummary(db, {
        resumeId: runtime.context.currentResumeId,
        summary,
      });
      return result;
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to update summary",
      };
    }
  },
  {
    description:
      "Update the professional summary section of the currently edited resume.",
    name: "updateSummary",
    schema: updateSummarySchema.omit({ resumeId: true }), // resumeId comes from context
  },
);

/**
 * Tool: Get resume details for viewing/editing
 */
export const getResumeTool = tool(
  async (
    { resumeId },
    runtime: ToolRuntime<typeof stateSchema, typeof contextSchema>,
  ) => {
    try {
      return await getResume(db, runtime.context.userId, { id: resumeId });
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to fetch resume",
      };
    }
  },
  {
    description:
      "Fetch complete resume details including all sections, experience, and education.",
    name: "getResume",
    schema: z.object({
      resumeId: z.number(),
    }),
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
      return result;
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to add experience",
      };
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
      return result;
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to update skills",
      };
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
  async ({ url }, config) => {
    try {
      console.log(config.context.userId);
      const result = await fetchJobDescription({ url });
      return result;
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch job description",
      };
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
  async (
    _input,
    runtime: ToolRuntime<typeof stateSchema, typeof contextSchema>,
  ) => {
    try {
      return await listResumes(db, runtime.context.userId);
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to list resumes",
      };
    }
  },
  {
    description:
      "List all available resumes for the user. Returns resume IDs and names.",
    name: "listResumes",
    schema: z.object({}),
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
