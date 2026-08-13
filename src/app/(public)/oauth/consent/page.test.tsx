import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import OAuthConsentPage from "./page";

const { getOAuthClientPublic } = vi.hoisted(() => ({
  getOAuthClientPublic: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("~/auth", () => ({
  auth: { api: { getOAuthClientPublic } },
}));

test("shows the requesting OAuth client and scopes", async () => {
  getOAuthClientPublic.mockResolvedValue({
    client_id: "mcp-client",
    client_name: "MCP Inspector",
  });

  render(
    await OAuthConsentPage({
      searchParams: Promise.resolve({
        client_id: "mcp-client",
        scope: "openid mcp:tools",
        sig: "signed-request",
      }),
    }),
  );

  expect(screen.getByText(/MCP Inspector wants to connect/i)).toBeVisible();
  expect(screen.getByText("openid")).toBeVisible();
  expect(screen.getByText("mcp:tools")).toBeVisible();
  expect(screen.getByRole("button", { name: "Allow" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Deny" })).toBeVisible();
  expect(
    document.querySelector('input[name="oauthQuery"]'),
  ).not.toBeInTheDocument();
});
