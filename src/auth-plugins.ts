import { cimd } from "@better-auth/cimd";
import { mcp } from "@better-auth/mcp";
import type { ClientMetadataResourceFetch } from "@better-auth/oauth-provider";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins/jwt";

import {
  MCP_CLIENT_DEFAULT_SCOPES,
  MCP_RESOURCE,
  OAUTH_SCOPES,
} from "~/server/lib/oauth";

export function createAuthPlugins(
  fetchClientMetadataResource: ClientMetadataResourceFetch,
) {
  return [
    jwt(),
    mcp({
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationAllowedScopes: [...OAUTH_SCOPES],
      clientRegistrationDefaultScopes: [...MCP_CLIENT_DEFAULT_SCOPES],
      consentPage: "/oauth/consent",
      loginPage: "/login",
      resource: MCP_RESOURCE,
      resources: [
        {
          allowedScopes: [...OAUTH_SCOPES],
          identifier: MCP_RESOURCE,
          name: "Resume Coach MCP",
        },
      ],
      scopes: [...OAUTH_SCOPES],
    }),
    cimd({
      fetchClientMetadataResource,
      metadataProfile: "mcp-2026-07-28",
    }),
    nextCookies(),
  ];
}
