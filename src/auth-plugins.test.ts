import { beforeEach, expect, test, vi } from "vitest";
import { createAuthPlugins } from "./auth-plugins";

const { cimd, mcp } = vi.hoisted(() => ({ cimd: vi.fn(), mcp: vi.fn() }));

vi.mock("@better-auth/cimd", () => ({
  cimd: (options: unknown) => {
    cimd(options);
    return { id: "cimd" };
  },
}));
vi.mock("@better-auth/mcp", () => ({
  mcp: (options: unknown) => {
    mcp(options);
    return { id: "mcp" };
  },
}));
vi.mock("better-auth/next-js", () => ({
  nextCookies: () => ({ id: "next-cookies" }),
}));
vi.mock("better-auth/plugins/jwt", () => ({
  jwt: () => ({ id: "jwt" }),
}));

beforeEach(() => {
  cimd.mockClear();
  mcp.mockClear();
});

test("gives scope-less MCP registrations refresh and identity scopes", () => {
  createAuthPlugins(vi.fn());

  expect(mcp).toHaveBeenCalledWith(
    expect.objectContaining({
      clientRegistrationDefaultScopes: [
        "openid",
        "email",
        "offline_access",
        "mcp:tools",
      ],
    }),
  );
});

test("uses the supplied hardened transport for CIMD metadata", () => {
  const fetchClientMetadataResource = vi.fn();

  createAuthPlugins(fetchClientMetadataResource);

  expect(cimd).toHaveBeenCalledWith({
    fetchClientMetadataResource,
    metadataProfile: "mcp-2026-07-28",
  });
});
