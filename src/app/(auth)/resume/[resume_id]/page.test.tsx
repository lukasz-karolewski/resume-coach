import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import ResumeDetailPage from "./page";

const mockGetByIdQuery = vi.fn();
const mockNotFound = vi.fn();

vi.mock("next/navigation", () => ({
  notFound: () => {
    mockNotFound();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("~/trpc/server", () => ({
  api: {
    resume: {
      getById: {
        query: (...args: unknown[]) => mockGetByIdQuery(...args),
      },
    },
  },
}));

vi.mock("~/components/resume/resume-detail-client", () => ({
  default: ({ resume }: { resume: { name: string } }) => (
    <div>{`Resume detail ${resume.name}`}</div>
  ),
}));

describe("ResumeDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetByIdQuery.mockResolvedValue({
      contactInfo: null,
      education: [],
      experience: [],
      id: 7,
      name: "Platform Resume",
      summary: "Summary",
    });
  });

  test("renders resume detail from a server-side query", async () => {
    render(await ResumeDetailPage({ params: { resume_id: "7" } }));

    expect(mockGetByIdQuery).toHaveBeenCalledWith({ id: 7 });
    expect(
      screen.getByText("Resume detail Platform Resume"),
    ).toBeInTheDocument();
  });

  test("calls notFound for invalid resume ids", async () => {
    await expect(
      ResumeDetailPage({ params: { resume_id: "abc" } }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalled();
    expect(mockGetByIdQuery).not.toHaveBeenCalled();
  });
});
