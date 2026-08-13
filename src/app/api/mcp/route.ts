import { mcpHandler } from "@better-auth/oauth-provider";
import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { auth } from "~/auth";
import { allTools } from "~/server/agent/tools";
import {
  MCP_OAUTH_SCOPE,
  MCP_RESOURCE,
  OAUTH_ISSUER,
} from "~/server/lib/oauth";

const MCP_SERVER_INFO = {
  name: "resume-coach",
  version: "0.1.0",
};

type AgentTool = (typeof allTools)[number];

function isUpdateSummaryTool(tool: AgentTool) {
  return tool.name === "updateSummary";
}

function getInputSchema(tool: AgentTool) {
  if (isUpdateSummaryTool(tool)) {
    return z.object({
      resumeId: z.number().int().positive(),
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
      for (const agentTool of allTools) {
        server.registerTool(
          agentTool.name,
          {
            description: agentTool.description,
            inputSchema: getInputSchema(agentTool),
          },
          async (input) => {
            const toolInput = isUpdateSummaryTool(agentTool)
              ? { summary: input.summary }
              : input;
            const invokeTool = agentTool.invoke as unknown as (
              input: unknown,
              config: {
                context: {
                  currentResumeId: number | null;
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
    },
    { serverInfo: MCP_SERVER_INFO },
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
