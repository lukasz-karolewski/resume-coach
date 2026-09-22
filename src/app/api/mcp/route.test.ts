import {
  CLIENT_CAPABILITIES_META_KEY,
  CLIENT_INFO_META_KEY,
  PROTOCOL_VERSION_META_KEY,
} from "@modelcontextprotocol/server";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";
import * as route from "./route";

const { POST } = route;

const { agentTool, findConsent, invoke, verifyOptions } = vi.hoisted(() => {
  const invoke = vi.fn(function (this: { defaultConfig?: unknown }) {
    if (!this.defaultConfig) {
      throw new TypeError(
        "Cannot read properties of undefined (reading 'defaultConfig')",
      );
    }

    return [{ id: 7, name: "Platform resume" }];
  });

  return {
    agentTool: {
      defaultConfig: {},
      description: "List resumes",
      invoke,
      name: "listResumes",
    },
    findConsent: vi.fn(),
    invoke,
    verifyOptions: vi.fn(),
  };
});

async function readMcpResponse(response: Response) {
  const body = await response.text();
  const data = body.match(/data: (.+)\n/)?.[1];
  return JSON.parse(data ?? body);
}

function mcpRequest(method: string, params = {}) {
  const headers = new Headers({
    accept: "application/json, text/event-stream",
    authorization: "Bearer valid-token",
    "content-type": "application/json",
    "mcp-method": method,
    "mcp-protocol-version": "2026-07-28",
  });
  const name = (params as { name?: unknown }).name;
  if (typeof name === "string") headers.set("mcp-name", name);

  return new Request("http://localhost:3000/api/mcp", {
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method,
      params: {
        ...params,
        _meta: {
          [CLIENT_CAPABILITIES_META_KEY]: {},
          [CLIENT_INFO_META_KEY]: { name: "resume-coach-test", version: "1" },
          [PROTOCOL_VERSION_META_KEY]: "2026-07-28",
        },
      },
    }),
    headers,
    method: "POST",
  });
}

vi.mock("@better-auth/mcp", () => ({
  requireMcpAuth:
    (
      _auth: unknown,
      handler: (request: Request, jwt: unknown) => Response,
      options: unknown,
    ) =>
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
        client_id: "chatgpt-client",
        scope: "mcp:tools",
        sub: "oauth-user-1",
      });
    },
}));

vi.mock("~/auth", () => ({
  auth: {},
}));

vi.mock("~/server/db", () => ({
  db: { oauthConsent: { findFirst: findConsent } },
}));

vi.mock("~/server/agent/tools", () => ({
  headlessTools: [{ ...agentTool, schema: z.object({}) }],
}));

describe("MCP route", () => {
  beforeEach(() => {
    invoke.mockReset();
    findConsent.mockReset();
    findConsent.mockResolvedValue({ id: "consent-1" });
    verifyOptions.mockClear();
  });

  test("exports only the stateless POST transport", () => {
    expect("GET" in route).toBe(false);
  });

  test("uses the installed MCP authorization package", async () => {
    const mcp =
      await vi.importActual<Record<string, unknown>>("@better-auth/mcp");

    expect(mcp.requireMcpAuth).toEqual(expect.any(Function));
  });

  test("challenges unauthenticated clients with protected-resource metadata", async () => {
    const response = await POST(
      new Request("http://localhost/api/mcp", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("WWW-Authenticate")).toContain(
      "/.well-known/oauth-protected-resource/api/mcp",
    );
  });

  test("offers safe resume editing workflow guidance", async () => {
    const response = await POST(
      mcpRequest("prompts/get", {
        arguments: { objective: "Tailor a disposable copy" },
        name: "edit-resume-safely",
      }),
    );
    const payload = await readMcpResponse(response);

    expect(response.status).toBe(200);
    expect(payload.result.messages[0].content.text).toContain(
      "Objective: Tailor a disposable copy",
    );
    expect(payload.result.messages[0].content.text).toContain(
      "Use listResumes first",
    );
  });

  test("uses the OAuth subject as the tool user", async () => {
    const response = await POST(
      mcpRequest("tools/call", {
        arguments: {},
        name: "listResumes",
      }),
    );

    expect(response.status).toBe(200);
    expect(invoke).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        context: { currentResumeId: null, userId: "oauth-user-1" },
      }),
    );
    expect(invoke.mock.contexts[0]).toEqual(
      expect.objectContaining({ defaultConfig: {} }),
    );
    expect(verifyOptions).toHaveBeenCalledWith({
      requiredScopes: ["mcp:tools"],
      resource: "http://localhost:3000/api/mcp",
    });
    expect(findConsent).toHaveBeenCalledWith({
      where: { clientId: "chatgpt-client", userId: "oauth-user-1" },
    });
  });

  test("rejects an access token after its grant is revoked", async () => {
    findConsent.mockResolvedValue(null);

    const response = await POST(mcpRequest("tools/list"));

    expect(response.status).toBe(403);
    expect(invoke).not.toHaveBeenCalled();
  });

  test("rejects session-oriented legacy MCP traffic", async () => {
    const response = await POST(
      new Request("http://localhost:3000/api/mcp", {
        body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "tools/list",
          params: {},
        }),
        headers: {
          authorization: "Bearer valid-token",
          "content-type": "application/json",
        },
        method: "POST",
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.text()).toContain("2026-07-28");
  });
});
