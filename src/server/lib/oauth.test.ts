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

  test.each(["openid", "email", "offline_access", MCP_OAUTH_SCOPE])(
    "describes the %s scope in plain language",
    (scope) => {
      const description = describeScope(scope);

      expect(description.trim()).not.toBe("");
      expect(description).not.toBe(scope);
    },
  );

  test("falls back to the raw identifier for an unknown scope", () => {
    expect(describeScope("custom")).toBe("custom");
  });
});
