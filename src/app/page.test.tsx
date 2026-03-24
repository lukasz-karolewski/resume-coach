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
    (headers as ReturnType<typeof vi.fn>).mockResolvedValue(new Headers());
  });

  test("renders the public landing page when unauthenticated", async () => {
    (auth.api.getSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    render(await HomePage());

    expect(
      screen.getByText(
        /turn job links into organized applications, stronger resumes/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start tracking roles/i }),
    ).toHaveAttribute("href", "/signup");
  });

  test("redirects authenticated users to resume", async () => {
    (auth.api.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: {
        id: "user-123",
      },
    });

    await HomePage();

    expect(redirect).toHaveBeenCalledWith("/resume");
  });
});
