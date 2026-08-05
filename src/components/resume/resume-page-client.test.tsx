import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { ResumePageClient } from "./resume-page-client";

const mockResumes = [
  {
    _count: { education: 2, experience: 3 },
    createdAt: new Date("2024-01-01T10:00:00.000Z"),
    id: 1,
    Job: null,
    name: "Software Engineer Resume",
    updatedAt: new Date("2024-01-15T15:30:00.000Z"),
  },
];

vi.mock("~/trpc/react", () => ({
  useTRPC: () => ({
    resume: {
      list: {
        queryOptions: (input: unknown) => ({ input, queryKey: ["resume"] }),
      },
    },
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useSuspenseQuery: () => ({ data: mockResumes }),
}));

vi.mock("./create-resume-button", () => ({
  default: ({
    buttonLabel = "Create new resume",
  }: {
    buttonLabel?: string;
  }) => <button type="button">{buttonLabel}</button>,
}));

vi.mock("./resume-sort-dropdown", () => ({
  default: ({ value }: { value: string }) => <div>{`Sort by ${value}`}</div>,
}));

describe("ResumePageClient", () => {
  test("renders hydrated resume data", () => {
    render(<ResumePageClient sort="last-updated" />);

    expect(screen.getByText("Software Engineer Resume")).toBeInTheDocument();
    expect(screen.getByText("3 roles")).toBeInTheDocument();
    expect(screen.getByText("2 entries")).toBeInTheDocument();
    expect(screen.getByText("Sort by last-updated")).toBeInTheDocument();
  });
});
