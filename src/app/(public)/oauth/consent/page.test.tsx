import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
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

beforeEach(() => {
  getOAuthClientPublic.mockResolvedValue({
    client_id: "mcp-client",
    client_name: "MCP Inspector",
  });
});

test("shows the requesting OAuth client and one entry per requested scope", async () => {
  render(
    await OAuthConsentPage({
      searchParams: Promise.resolve({
        client_id: "mcp-client",
        scope: "openid mcp:tools",
        sig: "signed-request",
      }),
    }),
  );

  expect(getOAuthClientPublic).toHaveBeenCalledWith(
    expect.objectContaining({ query: { client_id: "mcp-client" } }),
  );
  expect(screen.getByText(/MCP Inspector/)).toBeVisible();
  expect(
    within(screen.getByRole("list")).getAllByRole("listitem"),
  ).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Allow" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Deny" })).toBeVisible();
});

test("refuses to offer consent without a client identifier", async () => {
  render(
    await OAuthConsentPage({
      searchParams: Promise.resolve({ scope: "openid" }),
    }),
  );

  expect(getOAuthClientPublic).not.toHaveBeenCalled();
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Allow" }),
  ).not.toBeInTheDocument();
});
