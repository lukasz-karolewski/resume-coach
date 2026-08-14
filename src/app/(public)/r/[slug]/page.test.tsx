import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PublicResumePage, { metadata } from "./page";

const mockConnection = vi.fn();
const mockGetPublicResumeBySlug = vi.fn();
const mockNotFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/server", () => ({ connection: () => mockConnection() }));
vi.mock("next/navigation", () => ({ notFound: () => mockNotFound() }));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/lib/resume-permalink", () => ({
  getPublicResumeBySlug: (...args: unknown[]) =>
    mockGetPublicResumeBySlug(...args),
}));
vi.mock("~/components/resume/public-resume-client", () => ({
  default: ({ resume }: { resume: { name: string } }) => (
    <div>{resume.name}</div>
  ),
}));

describe("PublicResumePage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders a live resume without enabling search indexing", async () => {
    mockGetPublicResumeBySlug.mockResolvedValue({ name: "Jane Resume" });

    render(
      await PublicResumePage({
        params: Promise.resolve({ slug: "Jane-Doe" }),
      }),
    );

    expect(mockConnection).toHaveBeenCalled();
    expect(mockGetPublicResumeBySlug).toHaveBeenCalledWith({}, "Jane-Doe");
    expect(screen.getByText("Jane Resume")).toBeVisible();
    expect(metadata.robots).toEqual({ follow: false, index: false });
  });

  it("returns not found for a revoked link", async () => {
    mockGetPublicResumeBySlug.mockResolvedValue(null);

    await expect(
      PublicResumePage({ params: Promise.resolve({ slug: "revoked-link" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });
});
