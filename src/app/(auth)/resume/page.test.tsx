import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import ResumePage from "./page";

const mockResumeListQuery = vi.fn();

vi.mock("~/trpc/server", () => ({
  api: {
    resume: {
      list: {
        query: (...args: unknown[]) => mockResumeListQuery(...args),
      },
    },
  },
}));

vi.mock("~/components/resume/create-resume-button", () => ({
  default: ({
    buttonLabel = "Create new resume",
  }: {
    buttonLabel?: string;
  }) => <button type="button">{buttonLabel}</button>,
}));

vi.mock("~/components/resume/resume-date", () => ({
  default: ({ label, value }: { label: string; value: Date | string }) => (
    <p>{`${label} ${String(value)}`}</p>
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("ResumePage", () => {
  const mockResumes = [
    {
      _count: {
        education: 2,
        experience: 3,
      },
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
      id: 1,
      Job: null,
      name: "Software Engineer Resume",
      updatedAt: new Date("2024-01-15T15:30:00.000Z"),
    },
    {
      _count: {
        education: 1,
        experience: 2,
      },
      createdAt: new Date("2024-02-01T12:00:00.000Z"),
      id: 2,
      Job: {
        company: "Tech Corp",
        title: "Senior Data Scientist",
      },
      name: "Data Scientist Resume",
      updatedAt: new Date("2024-02-10T09:45:00.000Z"),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockResumeListQuery.mockResolvedValue(mockResumes);
  });

  test("renders the resume list from a server-side query", async () => {
    render(await ResumePage());

    expect(mockResumeListQuery).toHaveBeenCalledWith(undefined);
    expect(screen.getByText("My Resumes")).toBeInTheDocument();
    expect(screen.getByText("Software Engineer Resume")).toBeInTheDocument();
    expect(screen.getByText("Data Scientist Resume")).toBeInTheDocument();
  });

  test("shows empty state when no resumes exist", async () => {
    mockResumeListQuery.mockResolvedValue([]);

    render(await ResumePage());

    expect(screen.getByText("No resumes yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create your first resume to start building tailored versions.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create your first resume" }),
    ).toBeInTheDocument();
  });

  test("renders linked titles and resume summary information", async () => {
    render(await ResumePage());

    expect(
      screen.getByRole("link", { name: "Software Engineer Resume" }),
    ).toHaveAttribute("href", "/resume/1");
    expect(
      screen.getByRole("link", { name: "Data Scientist Resume" }),
    ).toHaveAttribute("href", "/resume/2");
    expect(screen.getByText(/3 roles/)).toBeInTheDocument();
    expect(screen.getByText(/2 entries/)).toBeInTheDocument();
    expect(screen.getByText(/Senior Data Scientist/)).toBeInTheDocument();
  });

  test("renders updated above created in a left-aligned footer stack", async () => {
    const { container } = render(await ResumePage());

    expect(
      container.querySelector(
        ".flex.flex-col.items-start.gap-1.text-xs.text-muted-foreground\\/80",
      ),
    ).toBeTruthy();
  });
});
