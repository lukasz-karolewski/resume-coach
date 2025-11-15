import { tool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { db } from "~/server/db";

/**
 * Tool: Create a working copy of a resume for editing
 */
export const createResumeCopyTool = tool(
  async ({ sourceResumeId }) => {
    try {
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
        where: { id: sourceResumeId },
      });

      if (!sourceResume) {
        return JSON.stringify({ error: "Source resume not found" });
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

      return JSON.stringify({
        name: newResume.name,
        resumeId: newResume.id,
        success: true,
      });
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
    schema: z.object({
      sourceResumeId: z.number().describe("The ID of the resume to copy"),
    }),
  },
);

/**
 * Tool: Update accomplishments for a specific position
 */
export const updateAccomplishmentsTool = tool(
  async ({ positionId, accomplishments }) => {
    try {
      const position = await db.position.update({
        data: {
          accomplishments: accomplishments.join("\n"),
        },
        where: { id: positionId },
      });

      return JSON.stringify({
        positionId: position.id,
        success: true,
        title: position.title,
      });
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
    schema: z.object({
      accomplishments: z
        .array(z.string())
        .describe("Array of accomplishment bullet points"),
      positionId: z.number().describe("The ID of the position to update"),
    }),
  },
);

/**
 * Tool: Update the professional summary
 */
export const updateSummaryTool = tool(
  async ({ resumeId, summary }) => {
    try {
      const resume = await db.resume.update({
        data: { summary },
        where: { id: resumeId },
      });

      return JSON.stringify({
        resumeId: resume.id,
        success: true,
      });
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
    schema: z.object({
      resumeId: z.number().describe("The ID of the resume to update"),
      summary: z.string().describe("The new professional summary text"),
    }),
  },
);

/**
 * Tool: Get resume details for viewing/editing
 */
export const getResumeTool = tool(
  async ({ resumeId }) => {
    try {
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
        where: { id: resumeId },
      });

      if (!resume) {
        return JSON.stringify({ error: "Resume not found" });
      }

      return JSON.stringify({
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
      });
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
    schema: z.object({
      resumeId: z.number().describe("The ID of the resume to fetch"),
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
      const resume = await db.resume.findUnique({
        include: { experience: true },
        where: { id: resumeId },
      });

      if (!resume) {
        return JSON.stringify({ error: "Resume not found" });
      }

      // Check if experience for this company already exists
      const existingExperience = resume.experience.find(
        (exp) => exp.companyName === companyName,
      );

      if (existingExperience) {
        // Add position to existing experience
        await db.position.create({
          data: {
            accomplishments: JSON.stringify(accomplishments),
            endDate: endDate ? new Date(endDate) : null,
            experienceId: existingExperience.id,
            location,
            startDate: new Date(startDate),
            title,
          },
        });
      } else {
        // Create new experience with position
        await db.experience.create({
          data: {
            companyName,
            link: null,
            positions: {
              create: {
                accomplishments: JSON.stringify(accomplishments),
                endDate: endDate ? new Date(endDate) : null,
                location,
                startDate: new Date(startDate),
                title,
              },
            },
            resumeId,
          },
        });
      }

      return JSON.stringify({
        message: `Added ${title} at ${companyName}`,
        success: true,
      });
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
    schema: z.object({
      accomplishments: z.array(z.string()).describe("List of accomplishments"),
      companyName: z.string().describe("Company name"),
      endDate: z
        .string()
        .optional()
        .describe("End date (ISO format), optional for current jobs"),
      location: z.string().describe("Job location"),
      resumeId: z.number().describe("The ID of the resume"),
      startDate: z.string().describe("Start date (ISO format)"),
      title: z.string().describe("Job title"),
    }),
  },
);

/**
 * Tool: Update skills for a position
 */
export const updateSkillsTool = tool(
  async ({ positionId, skills }) => {
    try {
      // Remove existing skills
      await db.positionSkill.deleteMany({
        where: { positionId },
      });

      // Add new skills
      for (const skillName of skills) {
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
            positionId,
            skillId: skill.id,
          },
        });
      }

      return JSON.stringify({
        positionId,
        skills,
        success: true,
      });
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
    schema: z.object({
      positionId: z.number().describe("The ID of the position"),
      skills: z.array(z.string()).describe("Array of skill names"),
    }),
  },
);

/**
 * Subagent Tool: Fetch and parse job description from URL
 * Uses LLM to extract structured information from HTML
 */
export const fetchJobDescriptionTool = tool(
  async ({ url }) => {
    try {
      // Fetch the page content
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!response.ok) {
        return JSON.stringify({
          error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
        });
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
        return JSON.stringify({
          job: jobData,
          success: true,
        });
      } catch {
        // If LLM didn't return pure JSON, try to extract it
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jobData = JSON.parse(jsonMatch[0]);
          return JSON.stringify({
            job: jobData,
            success: true,
          });
        }
        throw new Error("Failed to parse LLM response");
      }
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
    schema: z.object({
      url: z.string().url().describe("The URL of the job posting"),
    }),
  },
);

/**
 * Tool: List all resumes for the user
 */
export const listResumesTool = tool(
  async ({ userId }) => {
    try {
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
            userId,
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

      return JSON.stringify({
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
      });
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
