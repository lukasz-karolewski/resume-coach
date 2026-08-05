import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { ProfilePageClient } from "./profile-page-client";

const mockTrpc = {
  profile: {
    getAccomplishmentProfile: {
      queryOptions: () => ({ queryKey: ["profile", "accomplishments"] }),
    },
    getUserInfo: {
      queryOptions: () => ({ queryKey: ["profile", "user"] }),
    },
  },
};

vi.mock("~/trpc/react", () => ({
  useTRPC: () => mockTrpc,
}));

vi.mock("@tanstack/react-query", () => ({
  useSuspenseQuery: ({ queryKey }: { queryKey: string[] }) => {
    if (queryKey[1] === "user") {
      return { data: { email: "jane@example.com", name: null } };
    }

    return {
      data: {
        roles: [
          {
            companyName: "Example Corp",
            endDate: null,
            entries: [{ content: "Improved onboarding.", id: 1 }],
            id: 1,
            location: "Remote",
            startDate: new Date("2023-01-01T00:00:00.000Z"),
            title: "Senior Engineer",
          },
        ],
      },
    };
  },
}));

vi.mock("./accomplishment-profile-editor", () => ({
  AccomplishmentProfileEditor: ({
    initialProfile,
  }: {
    initialProfile: { roles: { startMonth: string }[] };
  }) => <div>{`Profile editor ${initialProfile.roles[0]?.startMonth}`}</div>,
}));

describe("ProfilePageClient", () => {
  test("reads hydrated profile data through suspense queries", () => {
    render(<ProfilePageClient />);

    expect(screen.getByText("Not provided")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("Profile editor 2023-01")).toBeInTheDocument();
  });
});
