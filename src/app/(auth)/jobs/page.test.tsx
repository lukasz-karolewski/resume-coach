import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import JobsPage from "./page";

const mockPrefetch = vi.fn();

vi.mock("~/trpc/server", () => ({
  HydrateClient: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="hydrate-client">{children}</div>
  ),
  prefetch: (options: unknown) => mockPrefetch(options),
  trpc: {
    job: { getJobs: { queryOptions: () => ({ queryKey: ["jobs"] }) } },
    resume: {
      list: {
        queryOptions: (input: unknown) => ({ input, queryKey: ["resumes"] }),
      },
    },
  },
}));

vi.mock("~/components/jobs/job-page-client", () => ({
  JobPageClient: () => <div>Job tracker client</div>,
}));

describe("JobsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("prefetches applications and resumes before rendering the tracker", () => {
    render(<JobsPage />);

    expect(mockPrefetch).toHaveBeenCalledWith({ queryKey: ["jobs"] });
    expect(mockPrefetch).toHaveBeenCalledWith({
      input: { sort: "last-updated" },
      queryKey: ["resumes"],
    });
    expect(screen.getByTestId("hydrate-client")).toContainElement(
      screen.getByText("Job tracker client"),
    );
  });
});
