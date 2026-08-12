import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import ResumePage from "./page";

const mockPrefetch = vi.fn();

vi.mock("~/trpc/server", () => ({
  HydrateClient: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="hydrate-client">{children}</div>
  ),
  prefetch: (options: unknown) => mockPrefetch(options),
  trpc: {
    job: { getJobs: { queryOptions: () => ({ queryKey: ["job"] }) } },
    profile: {
      getAccomplishmentProfile: {
        queryOptions: () => ({ queryKey: ["profile"] }),
      },
    },
    resume: {
      list: {
        queryOptions: (input: unknown) => ({ input, queryKey: ["resume"] }),
      },
    },
  },
}));

vi.mock("~/components/resume/resume-page-client", () => ({
  ResumePageClient: ({ sort }: { sort: string }) => (
    <div>{`Resume client body ${sort}`}</div>
  ),
}));

describe("ResumePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("prefetches route and modal data with the normalized sort", async () => {
    render(
      await ResumePage({ searchParams: Promise.resolve({ sort: "name" }) }),
    );

    expect(mockPrefetch).toHaveBeenCalledWith({
      input: { sort: "name" },
      queryKey: ["resume"],
    });
    expect(mockPrefetch).toHaveBeenCalledWith({ queryKey: ["job"] });
    expect(mockPrefetch).toHaveBeenCalledWith({ queryKey: ["profile"] });
    expect(screen.getByTestId("hydrate-client")).toContainElement(
      screen.getByText("Resume client body name"),
    );
  });

  test("uses last-updated by default", async () => {
    render(await ResumePage({}));

    expect(
      screen.getByText("Resume client body last-updated"),
    ).toBeInTheDocument();
  });
});
