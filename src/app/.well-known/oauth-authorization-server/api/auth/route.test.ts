import { expect, test, vi } from "vitest";

vi.unmock("~/auth");

test("publishes the OAuth authorization server used by MCP", async () => {
  const { GET } = await import("./route");
  const response = await GET(
    new Request(
      "http://localhost:3000/.well-known/oauth-authorization-server/api/auth",
    ),
  );
  const metadata = await response.json();

  expect(response.status).toBe(200);
  expect(metadata).toEqual(
    expect.objectContaining({
      authorization_endpoint: "http://localhost:3000/api/auth/oauth2/authorize",
      issuer: "http://localhost:3000/api/auth",
      registration_endpoint: "http://localhost:3000/api/auth/oauth2/register",
      token_endpoint: "http://localhost:3000/api/auth/oauth2/token",
    }),
  );
  expect(metadata.scopes_supported).toContain("mcp:tools");
});
