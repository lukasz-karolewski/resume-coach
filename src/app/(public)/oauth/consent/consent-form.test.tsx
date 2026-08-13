import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { authClient } from "~/auth-client";
import { ConsentForm } from "./consent-form";

vi.mock("~/auth-client", () => ({
  authClient: {
    oauth2: {
      consent: vi.fn(),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(authClient.oauth2.consent).mockResolvedValue({
    data: { redirect: true, url: "http://127.0.0.1/callback" },
    error: null,
  });
});

test.each([
  ["Allow", true],
  ["Deny", false],
] as const)(
  "submits the %s decision through the browser OAuth client",
  async (label, accept) => {
    render(<ConsentForm />);

    fireEvent.click(screen.getByRole("button", { name: label }));

    await waitFor(() => {
      expect(authClient.oauth2.consent).toHaveBeenCalledWith({ accept });
    });
  },
);

test("shows OAuth submission errors", async () => {
  vi.mocked(authClient.oauth2.consent).mockResolvedValue({
    data: null,
    error: { message: "Authorization request expired" },
  });

  render(<ConsentForm />);
  fireEvent.click(screen.getByRole("button", { name: "Allow" }));

  expect(
    await screen.findByText("Authorization request expired"),
  ).toBeVisible();
});
