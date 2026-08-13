import {
  MCP_OAUTH_SCOPE,
  MCP_RESOURCE,
  OAUTH_ISSUER,
} from "~/server/lib/oauth";

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=300, stale-while-revalidate=300",
};

export function GET() {
  return Response.json(
    {
      authorization_servers: [OAUTH_ISSUER],
      bearer_methods_supported: ["header"],
      resource: MCP_RESOURCE,
      resource_name: "Resume Coach MCP",
      scopes_supported: [MCP_OAUTH_SCOPE],
    },
    { headers: CORS_HEADERS },
  );
}

export function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS, status: 204 });
}
