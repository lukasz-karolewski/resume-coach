import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import ProfilePage from "./page";

const mockPrefetch = vi.fn();
const mockUserInformationQueryOptions = vi.fn(() => ({
  queryKey: ["profile", "getUserInfo"],
}));
const mockAccomplishmentQueryOptions = vi.fn(() => ({
  queryKey: ["profile", "getAccomplishmentProfile"],
}));
const mockConnectedAppsQueryOptions = vi.fn(() => ({
  queryKey: ["profile", "getConnectedApps"],
}));

vi.mock("~/trpc/server", () => ({
  HydrateClient: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="hydrate-client">{children}</div>
  ),
  prefetch: (options: unknown) => mockPrefetch(options),
  trpc: {
    profile: {
      getAccomplishmentProfile: {
        queryOptions: () => mockAccomplishmentQueryOptions(),
      },
      getConnectedApps: {
        queryOptions: () => mockConnectedAppsQueryOptions(),
      },
      getUserInfo: {
        queryOptions: () => mockUserInformationQueryOptions(),
      },
    },
  },
}));

vi.mock("~/components/profile/profile-page-client", () => ({
  ProfilePageClient: () => <div>Profile client body</div>,
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("prefetches profile queries inside the hydration boundary", () => {
    render(<ProfilePage />);

    expect(mockPrefetch).toHaveBeenCalledWith({
      queryKey: ["profile", "getUserInfo"],
    });
    expect(mockPrefetch).toHaveBeenCalledWith({
      queryKey: ["profile", "getAccomplishmentProfile"],
    });
    expect(mockPrefetch).toHaveBeenCalledWith({
      queryKey: ["profile", "getConnectedApps"],
    });
    expect(screen.getByTestId("hydrate-client")).toContainElement(
      screen.getByText("Profile client body"),
    );
  });
});
