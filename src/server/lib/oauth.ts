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
