import { mcpHandler } from "@better-auth/oauth-provider";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { auth } from "~/auth";
import { resumeIdSchema } from "~/lib/schemas/resume-identifiers";
import { headlessTools } from "~/server/agent/tools";
import {
  MCP_OAUTH_SCOPE,
  MCP_RESOURCE,
  OAUTH_ISSUER,
} from "~/server/lib/oauth";

const MCP_SERVER_INFO = {
  name: "resume-coach",
  version: "0.1.0",
};

type AgentTool = (typeof headlessTools)[number];

const READ_ONLY_TOOLS = new Set([
  "fetchJobDescription",
  "getResume",
  "listResumes",
]);
const IDEMPOTENT_TOOLS = new Set([
  "updateAccomplishments",
  "updateSkills",
  "updateSummary",
]);

function getToolAnnotations(tool: AgentTool) {
  return {
    destructiveHint: tool.name === "deleteResume",
    idempotentHint: IDEMPOTENT_TOOLS.has(tool.name),
    openWorldHint: tool.name === "fetchJobDescription",
    readOnlyHint: READ_ONLY_TOOLS.has(tool.name),
  };
}

function isUpdateSummaryTool(tool: AgentTool) {
  return tool.name === "updateSummary";
}

function getInputSchema(tool: AgentTool) {
  if (isUpdateSummaryTool(tool)) {
    return z.object({
      resumeId: resumeIdSchema,
      summary: z.string(),
    });
  }

  return tool.schema;
}

function formatToolResult(result: unknown) {
  const text =
    typeof result === "string" ? result : JSON.stringify(result ?? null);
  const isError =
    typeof result === "object" &&
    result !== null &&
    "error" in result &&
    typeof result.error === "string";

  return {
    content: [{ text, type: "text" as const }],
    ...(isError ? { isError: true } : {}),
  };
}

function createHandler(userId: string) {
  return createMcpHandler(
    (server) => {
      for (const agentTool of headlessTools) {
        server.registerTool(
          agentTool.name,
          {
            annotations: getToolAnnotations(agentTool),
            description: agentTool.description,
            inputSchema: getInputSchema(agentTool),
          },
          async (input) => {
            const toolInput = isUpdateSummaryTool(agentTool)
              ? { summary: input.summary }
              : input;
            const invokeTool = agentTool.invoke.bind(agentTool) as unknown as (
              input: unknown,
              config: {
                context: {
                  currentResumeId: string | null;
                  userId: string;
                };
              },
            ) => Promise<unknown>;
            const result = await invokeTool(toolInput, {
              context: {
                currentResumeId: isUpdateSummaryTool(agentTool)
                  ? input.resumeId
                  : null,
                userId,
              },
            });

            return formatToolResult(result);
          },
        );
      }

      server.registerPrompt(
        "edit-resume-safely",
        {
          argsSchema: z.object({
            objective: z
              .string()
              .optional()
              .describe("What the user wants to change in the resume"),
          }),
          description:
            "Plan a safe, verifiable resume editing workflow using Resume Coach tools.",
          title: "Edit a resume safely",
        },
        ({ objective }) => ({
          messages: [
            {
              content: {
                text: [
                  objective
                    ? `Objective: ${objective}`
                    : "Objective: Help the user inspect or edit a resume.",
                  "Use listResumes first and never guess IDs.",
                  "Read the selected resume with getResume before changing it.",
                  "Clone before experimental or broad edits, and never modify the source clone accidentally.",
                  "Treat updateSummary, updateAccomplishments, and updateSkills as complete replacements, preserving content that should remain.",
                  "Read the resume after each mutation to verify the result.",
                  "Use deleteResume only for an exact, verified disposable copy and never for its source.",
                ].join("\n"),
                type: "text" as const,
              },
              role: "user" as const,
            },
          ],
        }),
      );
    },
    {
      instructions:
        "Resume Coach manages resumes owned by the authenticated user. Discover IDs with listResumes/getResume, preserve source data, treat update tools as replacements, and verify every mutation by reading it back.",
      serverInfo: MCP_SERVER_INFO,
    },
  );
}

const handleOAuthRequest = mcpHandler(
  {
    jwksUrl: `${OAUTH_ISSUER}/jwks`,
    scopes: [MCP_OAUTH_SCOPE],
    verifyOptions: {
      audience: MCP_RESOURCE,
      issuer: OAUTH_ISSUER,
    },
  },
  (request, jwt) => {
    if (!jwt.sub) {
      return new Response("Access token is missing a user subject", {
        status: 401,
      });
    }

    return createHandler(jwt.sub)(request);
  },
);

async function handle(request: Request) {
  if (request.headers.get("authorization")?.startsWith("Bearer ")) {
    return handleOAuthRequest(request);
  }

  const session = await auth.api.getSession({ headers: request.headers });

  if (session?.user?.id) {
    return createHandler(session.user.id)(request);
  }

  return handleOAuthRequest(request);
}

export const GET = handle;
export const POST = handle;
