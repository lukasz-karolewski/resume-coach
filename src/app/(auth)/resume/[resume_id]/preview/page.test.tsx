import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import ResumePreviewPage from "./page";

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

vi.mock("~/components/resume/resume-preview-client", () => ({
  default: ({ resumeId }: { resumeId: number }) => (
    <div>{`Resume preview ${resumeId}`}</div>
  ),
}));

describe("ResumePreviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("prefetches the resume and renders its preview", async () => {
    render(
      await ResumePreviewPage({
        params: Promise.resolve({ resume_id: "7" }),
      }),
    );

    expect(mockPrefetch).toHaveBeenCalledWith({
      input: { id: 7 },
      queryKey: ["resume"],
    });
    expect(screen.getByTestId("hydrate-client")).toContainElement(
      screen.getByText("Resume preview 7"),
    );
  });

  test("calls notFound for invalid resume ids", async () => {
    await expect(
      ResumePreviewPage({
        params: Promise.resolve({ resume_id: "invalid" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalled();
    expect(mockPrefetch).not.toHaveBeenCalled();
  });
});
