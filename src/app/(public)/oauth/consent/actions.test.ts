import { expect, test, vi } from "vitest";
import { respondToOAuthConsent } from "./actions";

const { oauth2Consent, redirect } = vi.hoisted(() => ({
  oauth2Consent: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({ redirect }));

vi.mock("~/auth", () => ({
  auth: { api: { oauth2Consent } },
}));

test("submits the signed OAuth request and follows the client redirect", async () => {
  oauth2Consent.mockResolvedValue({ url: "https://client.example/callback" });
  const formData = new FormData();
  formData.set("decision", "allow");
  formData.set("oauthQuery", "client_id=mcp-client&sig=signed-request");

  await respondToOAuthConsent(formData);

  expect(oauth2Consent).toHaveBeenCalledWith({
    body: {
      accept: true,
      oauth_query: "client_id=mcp-client&sig=signed-request",
    },
    headers: expect.any(Headers),
  });
  expect(redirect).toHaveBeenCalledWith("https://client.example/callback");
});
