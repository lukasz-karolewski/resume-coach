import { env } from "~/env";

const applicationURL = env.BETTER_AUTH_URL ?? "http://localhost:3000";

export const MCP_OAUTH_SCOPE = "mcp:tools";
export const MCP_RESOURCE = new URL("/api/mcp", applicationURL).toString();
export const OAUTH_ISSUER = new URL("/api/auth", applicationURL).toString();
export const OAUTH_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  MCP_OAUTH_SCOPE,
] as const;

/**
 * ChatGPT registers without naming scopes. These defaults keep the connection
 * refreshable and expose the standard OpenID email claims it expects.
 */
export const MCP_CLIENT_DEFAULT_SCOPES = [
  "openid",
  "email",
  "offline_access",
  MCP_OAUTH_SCOPE,
] as const;

const SCOPE_DESCRIPTIONS: Record<string, string> = {
  email: "See your email address",
  offline_access: "Stay connected until you disconnect it",
  openid: "Confirm who you are",
  profile: "See your name and profile picture",
  [MCP_OAUTH_SCOPE]: "Use Resume Coach tools on your behalf",
};

export function describeScope(scope: string) {
  return SCOPE_DESCRIPTIONS[scope] ?? scope;
}
