import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import ProfilePage from "./page";

const mockProfileQuery = vi.fn();

vi.mock("~/trpc/server", () => ({
  api: {
    profile: {
      getUserInfo: {
        query: () => mockProfileQuery(),
      },
    },
  },
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders profile details when the server returns no name", async () => {
    mockProfileQuery.mockResolvedValue({
      email: "jane@example.com",
      name: null,
    });

    render(await ProfilePage());

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Not provided")).toBeInTheDocument();
  });

  test("renders profile details in the shadcn card layout", async () => {
    mockProfileQuery.mockResolvedValue({
      email: "jane@example.com",
      name: "Jane Doe",
    });

    render(await ProfilePage());

    expect(screen.getByText("Account information")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /import your linkedin profile/i }),
    ).toBeInTheDocument();
  });
});
