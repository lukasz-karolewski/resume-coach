import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import ResumeDetailPage from "./page";

const mockNotFound = vi.fn();
const mockPrefetch = vi.fn();

vi.mock("next/navigation", () => ({
  notFound: () => {
    mockNotFound();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("~/trpc/server", () => ({
  HydrateClient: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="hydrate-client">{children}</div>
  ),
  prefetch: (options: unknown) => mockPrefetch(options),
  trpc: {
    resume: {
      getById: {
        queryOptions: (input: unknown) => ({ input, queryKey: ["resume"] }),
      },
    },
  },
}));

vi.mock("~/components/resume/resume-detail-client", () => ({
  default: ({ resumeId }: { resumeId: string }) => (
    <div>{`Resume detail ${resumeId}`}</div>
  ),
}));

describe("ResumeDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("prefetches the detail query inside the hydration boundary", async () => {
    render(
      await ResumeDetailPage({
        params: Promise.resolve({ resume_id: "Res007" }),
      }),
    );

    expect(mockPrefetch).toHaveBeenCalledWith({
      input: { id: "Res007" },
      queryKey: ["resume"],
    });
    expect(screen.getByTestId("hydrate-client")).toContainElement(
      screen.getByText("Resume detail Res007"),
    );
  });

  test("calls notFound for invalid resume ids", async () => {
    await expect(
      ResumeDetailPage({ params: Promise.resolve({ resume_id: "abc" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalled();
    expect(mockPrefetch).not.toHaveBeenCalled();
  });
});
