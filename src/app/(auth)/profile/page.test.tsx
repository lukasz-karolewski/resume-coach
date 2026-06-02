import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import ProfilePage from "./page";

const mockProfileQuery = vi.fn();
const mockAccomplishmentProfileQuery = vi.fn();
const mockConnection = vi.fn();

vi.mock("next/server", () => ({
  connection: () => mockConnection(),
}));

vi.mock("~/trpc/server", () => ({
  api: {
    profile: {
      getAccomplishmentProfile: {
        query: () => mockAccomplishmentProfileQuery(),
      },
      getUserInfo: {
        query: () => mockProfileQuery(),
      },
    },
  },
}));

vi.mock("~/components/profile/accomplishment-profile-editor", () => ({
  AccomplishmentProfileEditor: ({
    initialProfile,
  }: {
    initialProfile: { roles: { companyName: string; id: string }[] };
  }) => (
    <div>
      <h2>Accomplishment profile</h2>
      <div>{`Profile editor (${initialProfile.roles.length})`}</div>
    </div>
  ),
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnection.mockResolvedValue(undefined);
    mockAccomplishmentProfileQuery.mockResolvedValue({
      roles: [],
    });
  });

  test("renders profile details when the server returns no name", async () => {
    mockProfileQuery.mockResolvedValue({
      email: "jane@example.com",
      name: null,
    });

    render(await ProfilePage());

    expect(screen.getByText("Profile")).toBeInTheDocument();
    expect(screen.getByText("Not provided")).toBeInTheDocument();
    expect(mockConnection).toHaveBeenCalledBefore(mockProfileQuery);
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

  test("renders the accomplishment profile editor section", async () => {
    mockProfileQuery.mockResolvedValue({
      email: "jane@example.com",
      name: "Jane Doe",
    });
    mockAccomplishmentProfileQuery.mockResolvedValue({
      roles: [
        {
          companyName: "Example Corp",
          endDate: null,
          entries: [{ content: "Improved onboarding conversion.", id: 1 }],
          id: 1,
          location: "Remote",
          startDate: new Date("2023-01-01T00:00:00.000Z"),
          title: "Senior Engineer",
        },
      ],
    });

    render(await ProfilePage());

    expect(screen.getByText("Accomplishment profile")).toBeInTheDocument();
    expect(screen.getByText("Profile editor (1)")).toBeInTheDocument();
  });
});
