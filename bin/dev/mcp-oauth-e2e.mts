/**
 * Drives a scope-less dynamic registration through PKCE, consent, token
 * exchange, MCP invocation, refresh, web sign-out, and app disconnection.
 * It creates and removes its own local test user and OAuth client.
 */
import { createHash, randomBytes } from "node:crypto";

import {
  CLIENT_CAPABILITIES_META_KEY,
  CLIENT_INFO_META_KEY,
  PROTOCOL_VERSION_META_KEY,
} from "@modelcontextprotocol/server";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", quiet: true });
process.env.BETTER_AUTH_URL = "http://localhost:3000";

const ORIGIN = "http://localhost:3000";
const REDIRECT = "https://chatgpt.com/connector_platform_oauth_redirect";
const email = `mcp-e2e-${Date.now()}@example.com`;
const password = "McpE2ePassword1!";
const verifier = randomBytes(32).toString("base64url");
const challenge = createHash("sha256").update(verifier).digest("base64url");

const { auth } = await import("~/auth");
const { db } = await import("~/server/db");

const realFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input instanceof Request ? input.url : input);
  if (url.startsWith(`${ORIGIN}/api/auth`)) {
    return auth.handler(
      input instanceof Request ? input : new Request(url, init),
    );
  }
  return realFetch(input as RequestInfo, init);
}) as typeof fetch;

let cookie = "";
let clientId: string | undefined;
let userId: string | undefined;
let runError: unknown;

async function call(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("origin", ORIGIN);
  if (cookie) headers.set("cookie", cookie);

  const response = await auth.handler(
    new Request(`${ORIGIN}/api/auth${path}`, { ...init, headers }),
  );
  const setCookie = response.headers.getSetCookie?.() ?? [];
  if (setCookie.length > 0) {
    cookie = setCookie.map((value) => value.split(";")[0]).join("; ");
  }
  return response;
}

function json(body: unknown): RequestInit {
  return {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  };
}

function form(body: Record<string, string>): RequestInit {
  return {
    body: new URLSearchParams(body).toString(),
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
  };
}

function decodeClaims(accessToken: string) {
  return JSON.parse(
    Buffer.from(accessToken.split(".")[1], "base64url").toString(),
  ) as {
    aud: string | string[];
    scope: string;
    sid?: string;
    sub: string;
  };
}

function mcpRequest(accessToken: string, id: number) {
  return new Request(`${ORIGIN}/api/mcp`, {
    body: JSON.stringify({
      id,
      jsonrpc: "2.0",
      method: "tools/list",
      params: {
        _meta: {
          [CLIENT_CAPABILITIES_META_KEY]: {},
          [CLIENT_INFO_META_KEY]: { name: "resume-coach-e2e", version: "1" },
          [PROTOCOL_VERSION_META_KEY]: "2026-07-28",
        },
      },
    }),
    headers: {
      accept: "application/json, text/event-stream",
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      "mcp-method": "tools/list",
      "mcp-protocol-version": "2026-07-28",
    },
    method: "POST",
  });
}

try {
  const registrationResponse = await call(
    "/oauth2/register",
    json({
      client_name: "Resume Coach MCP E2E",
      grant_types: ["authorization_code", "refresh_token"],
      redirect_uris: [REDIRECT],
      token_endpoint_auth_method: "none",
    }),
  );
  const client = (await registrationResponse.json()) as {
    client_id: string;
    scope: string;
  };
  if (registrationResponse.status !== 201) {
    throw new Error(
      `dynamic registration returned ${registrationResponse.status}`,
    );
  }
  clientId = client.client_id;

  const expectedDefaultScopes = [
    "openid",
    "email",
    "offline_access",
    "mcp:tools",
  ];
  const registeredScopes = new Set(client.scope.split(" "));
  if (!expectedDefaultScopes.every((scope) => registeredScopes.has(scope))) {
    throw new Error(`registration returned incomplete scopes: ${client.scope}`);
  }

  const resourceLink = await db.oauthClientResource.findFirst({
    where: {
      clientId,
      resourceId: `${ORIGIN}/api/mcp`,
    },
  });
  if (!resourceLink) {
    throw new Error("registration did not link the MCP resource");
  }

  cookie = "";
  const signupResponse = await call(
    "/sign-up/email",
    json({ email, name: "MCP E2E User", password }),
  );
  if (!signupResponse.ok) {
    throw new Error(`test user signup returned ${signupResponse.status}`);
  }

  const createdUser = await db.user.findUnique({ where: { email } });
  if (!createdUser) throw new Error("test user was not created");
  userId = createdUser.id;

  const authorizeQuery = new URLSearchParams({
    client_id: clientId,
    code_challenge: challenge,
    code_challenge_method: "S256",
    redirect_uri: REDIRECT,
    resource: `${ORIGIN}/api/mcp`,
    response_type: "code",
    scope: client.scope,
    state: "resume-coach-e2e",
  });
  const authorizeResponse = await call(
    `/oauth2/authorize?${authorizeQuery.toString()}`,
  );
  let location = authorizeResponse.headers.get("location") ?? "";

  if (location.includes("/oauth/consent")) {
    const consentResponse = await call(
      "/oauth2/consent",
      json({ accept: true, oauth_query: location.split("?")[1] }),
    );
    const consent = (await consentResponse.json()) as {
      redirectURI?: string;
      url?: string;
    };
    location = consent.url ?? consent.redirectURI ?? "";
  }

  const code = new URL(location, ORIGIN).searchParams.get("code");
  if (!code) throw new Error(`authorization returned no code: ${location}`);

  const tokenResponse = await call(
    "/oauth2/token",
    form({
      client_id: clientId,
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT,
      resource: `${ORIGIN}/api/mcp`,
    }),
  );
  const token = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token: string;
  };
  if (!tokenResponse.ok || !token.refresh_token) {
    throw new Error("token exchange did not issue a refresh token");
  }
  const claims = decodeClaims(token.access_token);
  if (
    ![claims.aud].flat().includes(`${ORIGIN}/api/mcp`) ||
    !claims.scope.split(" ").includes("mcp:tools")
  ) {
    throw new Error("access token is not bound to the MCP resource and scope");
  }

  const { POST } = await import("~/app/api/mcp/route");
  const firstMcpResponse = await POST(mcpRequest(token.access_token, 1));
  if (!firstMcpResponse.ok) {
    throw new Error(`initial tools/list returned ${firstMcpResponse.status}`);
  }

  const refreshResponse = await call(
    "/oauth2/token",
    form({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: token.refresh_token,
      resource: `${ORIGIN}/api/mcp`,
    }),
  );
  const refreshed = (await refreshResponse.json()) as {
    access_token: string;
    refresh_token: string;
  };
  if (!refreshResponse.ok) {
    throw new Error(`refresh returned ${refreshResponse.status}`);
  }

  const refreshedClaims = decodeClaims(refreshed.access_token);
  if (!refreshedClaims.sid) {
    throw new Error("refreshed token did not retain the approving session");
  }
  await db.session.delete({ where: { id: refreshedClaims.sid } });

  const signedOutRefreshResponse = await call(
    "/oauth2/token",
    form({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: refreshed.refresh_token,
      resource: `${ORIGIN}/api/mcp`,
    }),
  );
  const signedOutToken = (await signedOutRefreshResponse.json()) as {
    access_token: string;
  };
  if (!signedOutRefreshResponse.ok) {
    throw new Error(
      `refresh after web sign-out returned ${signedOutRefreshResponse.status}`,
    );
  }

  const signedOutMcpResponse = await POST(
    mcpRequest(signedOutToken.access_token, 2),
  );
  if (!signedOutMcpResponse.ok) {
    throw new Error(
      `tools/list after web sign-out returned ${signedOutMcpResponse.status}`,
    );
  }

  const { disconnectApp, listConnectedApps } = await import(
    "~/server/lib/connected-access"
  );
  const apps = await listConnectedApps(db, { userId });
  if (!apps.some((app) => app.clientId === clientId && app.isActive)) {
    throw new Error("connected-app listing did not find the live grant");
  }

  await disconnectApp(db, { clientId, userId });
  const revokedMcpResponse = await POST(
    mcpRequest(signedOutToken.access_token, 3),
  );
  if (revokedMcpResponse.status !== 403) {
    throw new Error(
      `disconnected access token returned ${revokedMcpResponse.status}`,
    );
  }

  const leftovers = await Promise.all([
    db.oauthAccessToken.count({ where: { clientId } }),
    db.oauthRefreshToken.count({ where: { clientId } }),
    db.oauthConsent.count({ where: { clientId } }),
  ]);
  if (leftovers.some((count) => count !== 0)) {
    throw new Error(
      `disconnect left OAuth rows behind: ${leftovers.join(",")}`,
    );
  }

  console.log("OAuth + MCP end-to-end check passed");
} catch (error) {
  runError = error;
} finally {
  globalThis.fetch = realFetch;
  const cleanupTasks: Promise<unknown>[] = [
    db.user.deleteMany({ where: { email } }),
  ];
  if (clientId) {
    cleanupTasks.push(db.oauthClient.deleteMany({ where: { clientId } }));
  }
  const cleanupResults = await Promise.allSettled(cleanupTasks);
  const cleanupFailure = cleanupResults.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  if (!runError && cleanupFailure) runError = cleanupFailure.reason;
}

if (runError) throw runError;
