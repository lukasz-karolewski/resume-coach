import { render, screen } from "@testing-library/react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { auth } from "~/auth";
import HomePage from "./page";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("~/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(headers).mockResolvedValue(new Headers());
  });

  test("renders the public landing page when unauthenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    render(await HomePage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /your career story,\s*logged as it happens\./i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start logging accomplishments/i }),
    ).toHaveAttribute("href", "/signup");
    expect(
      screen.getByRole("link", { name: /i already have an account/i }),
    ).toHaveAttribute("href", "/login");
  });

  test("redirects authenticated users to resume", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      session: {
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        expiresAt: new Date("2026-01-02T00:00:00.000Z"),
        id: "session-123",
        token: "test-token",
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        userId: "user-123",
      },
      user: {
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        email: "test@example.com",
        emailVerified: true,
        id: "user-123",
        name: "Test User",
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    });

    await HomePage();

    expect(redirect).toHaveBeenCalledWith("/resume");
  });
});
