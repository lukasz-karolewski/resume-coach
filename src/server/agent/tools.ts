"server-only";

import { type ToolRuntime, tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  addExperienceSchema,
  createResumeCopySchema,
  deleteResumeToolSchema,
  updateAccomplishmentsSchema,
  updateSkillsSchema,
  updateSummarySchema,
} from "~/lib/schemas/resume";
import { db } from "~/server/db";
import {
  fetchJobDescription,
  fetchJobDescriptionSchema,
} from "~/server/lib/job";
import {
  addExperience,
  createResumeCopy,
  deleteResume,
  getResume,
  listResumes,
  updateAccomplishments,
  updateSkills,
  updateSummary,
} from "~/server/lib/resume";
import type { contextSchema, stateSchema } from "./graph";

// TODO https://docs.langchain.com/oss/javascript/langchain/tools#stream-writer

/**
 * Tool: Create a working copy of a resume for editing
 */
export const cloneResumeTool = tool(
  async (
    { name, sourceResumeId },
    runtime: ToolRuntime<typeof stateSchema, typeof contextSchema>,
  ) => {
    try {
      const result = await createResumeCopy(db, runtime.context.userId, {
        name,
        sourceResumeId,
      });
      return result;
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to clone resume",
      };
    }
  },
  {
    description:
      "Clone an owned resume into a new independently editable resume. Read the source with getResume first, choose an explicit name, and use the returned new resume ID for later edits. The source resume is never changed.",
    name: "cloneResume",
    schema: createResumeCopySchema,
  },
);

/**
 * Tool: Permanently delete an owned resume
 */
export const deleteResumeTool = tool(
  async (
    { resumeId },
    runtime: ToolRuntime<typeof stateSchema, typeof contextSchema>,
  ) => {
    try {
      await deleteResume(db, runtime.context.userId, { id: resumeId });
      return { resumeId, success: true };
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to delete resume",
      };
    }
  },
  {
    description:
      "Permanently delete one resume owned by the authenticated user. This is irreversible. Call getResume immediately beforehand to verify the exact ID and never delete a source resume when cleaning up a clone.",
    name: "deleteResume",
    schema: deleteResumeToolSchema,
  },
);

/**
 * Tool: Ask the UI to open a resume page.
 * The chat stream turns a successful call into a `navigate` SSE event, so the
 * conversation keeps running while the user lands on the resume.
 */
export const openResumeTool = tool(
  async (
    { resumeId },
    runtime: ToolRuntime<typeof stateSchema, typeof contextSchema>,
  ) => {
    try {
      const resume = await getResume(db, runtime.context.userId, {
        id: resumeId,
      });
      return { name: resume.name, opened: true, resumeId };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Failed to open resume",
      };
    }
  },
  {
    description:
      "Open a resume page in the UI for the user. Use this after creating a resume copy, or whenever the user should look at a different resume. The chat stays open, so keep talking to the user in the same reply.",
    name: "openResume",
    schema: z.object({
      resumeId: z.number(),
    }),
  },
);

/**
 * Tool: Update accomplishments for a specific position
 */
export const updateAccomplishmentsTool = tool(
  async (
    { positionId, accomplishments },
    runtime: ToolRuntime<typeof stateSchema, typeof contextSchema>,
  ) => {
    try {
      const result = await updateAccomplishments(db, runtime.context.userId, {
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
      "Replace the complete Markdown accomplishments list for one position. Obtain the positionId from getResume, preserve accomplishments that should remain, and read the resume afterward to verify the replacement.",
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
      const result = await updateSummary(db, runtime.context.userId, {
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
      "Replace the complete professional summary of one resume. Preserve any text that should remain and call getResume afterward to verify the replacement.",
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
      "Read one owned resume in full, including position IDs needed by updateAccomplishments and updateSkills. Use this before every mutation and again afterward to verify the result.",
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
  async (
    {
      resumeId,
      companyName,
      title,
      startDate,
      endDate,
      location,
      accomplishments,
    },
    runtime: ToolRuntime<typeof stateSchema, typeof contextSchema>,
  ) => {
    try {
      const result = await addExperience(db, runtime.context.userId, {
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
    description:
      "Add a new employer and position to one owned resume. Dates must be ISO 8601 strings; omit endDate for a current role. Call getResume afterward to discover the new IDs and verify all fields.",
    name: "addExperience",
    schema: addExperienceSchema,
  },
);

/**
 * Tool: Update skills for a position
 */
export const updateSkillsTool = tool(
  async (
    { positionId, skills },
    runtime: ToolRuntime<typeof stateSchema, typeof contextSchema>,
  ) => {
    try {
      const result = await updateSkills(db, runtime.context.userId, {
        positionId,
        skills,
      });
      return result;
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Failed to update skills",
      };
    }
  },
  {
    description:
      "Replace the complete skills list for one position. Obtain positionId and current skills from getResume, preserve skills that should remain, and verify afterward with getResume.",
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
      "Fetch a public job-posting URL and parse its company, title, requirements, and responsibilities. This performs external network and model work but does not modify resumes.",
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
      "List resumes owned by the authenticated user, including IDs and metadata. Start here before getResume, cloneResume, or any mutation; never guess a resume ID.",
    name: "listResumes",
    schema: z.object({}),
  },
);

/**
 * Export all tools as an array
 */
export const allTools = [
  cloneResumeTool,
  openResumeTool,
  deleteResumeTool,
  updateAccomplishmentsTool,
  updateSummaryTool,
  getResumeTool,
  addExperienceTool,
  updateSkillsTool,
  fetchJobDescriptionTool,
  listResumesTool,
];

/** Tools whose result only means something to the first-party chat UI. */
const UI_ONLY_TOOL_NAMES = new Set<string>([openResumeTool.name]);

/** Tools suitable for remote clients that cannot receive app navigation events. */
export const headlessTools = allTools.filter(
  (agentTool) => !UI_ONLY_TOOL_NAMES.has(agentTool.name),
);
