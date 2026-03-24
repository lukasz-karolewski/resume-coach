import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import ProfilePage from "./page";

const mockProfileQuery = vi.fn();

vi.mock("~/trpc/react", () => ({
  api: {
    profile: {
      getUserInfo: {
        useQuery: () => mockProfileQuery(),
      },
    },
  },
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders a loading card while profile data is unavailable", () => {
    mockProfileQuery.mockReturnValue({
      data: undefined,
    });

    render(<ProfilePage />);

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(
      screen.getByText("Loading your account details."),
    ).toBeInTheDocument();
  });

  test("renders profile details in the shadcn card layout", () => {
    mockProfileQuery.mockReturnValue({
      data: {
        email: "jane@example.com",
        name: "Jane Doe",
      },
    });

    render(<ProfilePage />);

    expect(screen.getByText("Account information")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /import your linkedin profile/i }),
    ).toBeInTheDocument();
  });
});
