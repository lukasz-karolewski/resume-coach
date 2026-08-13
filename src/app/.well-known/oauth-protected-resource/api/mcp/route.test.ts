import { expect, test } from "vitest";
import { GET } from "./route";

test("publishes MCP protected-resource metadata", async () => {
  const response = await GET();

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual(
    expect.objectContaining({
      authorization_servers: ["http://localhost:3000/api/auth"],
      resource: "http://localhost:3000/api/mcp",
      scopes_supported: ["mcp:tools"],
    }),
  );
  expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
});
