import { describe, expect, test } from "vitest";

import {
  describeScope,
  MCP_CLIENT_DEFAULT_SCOPES,
  MCP_OAUTH_SCOPE,
} from "./oauth";

describe("MCP OAuth scopes", () => {
  test("gives scope-less client registrations durable OpenID access", () => {
    expect(MCP_CLIENT_DEFAULT_SCOPES).toEqual([
      "openid",
      "email",
      "offline_access",
      MCP_OAUTH_SCOPE,
    ]);
  });

  test.each([
    ["openid", "Confirm who you are"],
    ["email", "See your email address"],
    ["offline_access", "Stay connected until you disconnect it"],
    [MCP_OAUTH_SCOPE, "Use Resume Coach tools on your behalf"],
    ["custom", "custom"],
  ])("describes the %s scope", (scope, description) => {
    expect(describeScope(scope)).toBe(description);
  });
});
