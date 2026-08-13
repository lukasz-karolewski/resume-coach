import { beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";
import { GET, POST } from "./route";

const { getSession, invoke, verifyOptions } = vi.hoisted(() => ({
  getSession: vi.fn(),
  invoke: vi.fn(),
  verifyOptions: vi.fn(),
}));

async function readMcpResponse(response: Response) {
  const body = await response.text();
  const data = body.match(/data: (.+)\n/)?.[1];
  return JSON.parse(data ?? body);
}

vi.mock("@better-auth/oauth-provider", () => ({
  mcpHandler:
    (options: unknown, handler: (request: Request, jwt: unknown) => Response) =>
    async (request: Request) => {
      verifyOptions(options);
      if (request.headers.get("authorization") !== "Bearer valid-token") {
        return new Response("missing or invalid access token", {
          headers: {
            "WWW-Authenticate":
              'Bearer resource_metadata="http://localhost/.well-known/oauth-protected-resource/api/mcp"',
          },
          status: 401,
        });
      }

      return handler(request, {
        scope: "mcp:tools",
        sub: "oauth-user-1",
      });
    },
}));

vi.mock("~/auth", () => ({
  auth: { api: { getSession } },
}));

vi.mock("~/server/agent/tools", () => ({
  allTools: [
    {
      description: "List resumes",
      invoke,
      name: "listResumes",
      schema: z.object({}),
    },
  ],
}));

describe("MCP route", () => {
  beforeEach(() => {
    getSession.mockReset();
    invoke.mockReset();
    verifyOptions.mockClear();
    getSession.mockResolvedValue(null);
  });

  test("challenges unauthenticated clients with protected-resource metadata", async () => {
    const response = await GET(
      new Request("http://localhost/api/mcp", { method: "GET" }),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toContain(
      "/.well-known/oauth-protected-resource/api/mcp",
    );
  });

  test("keeps browser-session authentication for first-party clients", async () => {
    getSession.mockResolvedValue({ user: { id: "user-1" } });

    const response = await POST(
      new Request("http://localhost/api/mcp", {
        body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "tools/list",
          params: {},
        }),
        headers: {
          accept: "application/json, text/event-stream",
          "content-type": "application/json",
        },
        method: "POST",
      }),
    );
    const payload = await readMcpResponse(response);

    expect(response.status).toBe(200);
    expect(payload.result.tools).toEqual([
      expect.objectContaining({ name: "listResumes" }),
    ]);
  });

  test("uses the OAuth subject as the tool user", async () => {
    invoke.mockResolvedValue([{ id: 7, name: "Platform resume" }]);

    const response = await POST(
      new Request("http://localhost/api/mcp", {
        body: JSON.stringify({
          id: 2,
          jsonrpc: "2.0",
          method: "tools/call",
          params: { arguments: {}, name: "listResumes" },
        }),
        headers: {
          accept: "application/json, text/event-stream",
          authorization: "Bearer valid-token",
          "content-type": "application/json",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(200);
    expect(invoke).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        context: { currentResumeId: null, userId: "oauth-user-1" },
      }),
    );
    expect(verifyOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        scopes: ["mcp:tools"],
        verifyOptions: expect.objectContaining({
          audience: "http://localhost:3000/api/mcp",
          issuer: "http://localhost:3000/api/auth",
        }),
      }),
    );
  });
});
