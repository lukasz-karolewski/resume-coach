import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import ResumePage from "./page";

// Mock the tRPC hooks
const mockUseUtils = vi.fn();
const mockListQuery = vi.fn();
const mockGetJobsQuery = vi.fn();
const mockCreateMutation = vi.fn();
const mockDeleteMutation = vi.fn();
const mockDuplicateMutation = vi.fn();

vi.mock("~/trpc/react", () => ({
  api: {
    job: {
      getJobs: {
        useQuery: () => mockGetJobsQuery(),
      },
    },
    resume: {
      create: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useMutation: (opts: any) => mockCreateMutation(opts),
      },
      delete: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useMutation: (opts: any) => mockDeleteMutation(opts),
      },
      duplicate: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        useMutation: (opts: any) => mockDuplicateMutation(opts),
      },
      list: {
        useQuery: () => mockListQuery(),
      },
    },
    useUtils: () => mockUseUtils(),
  },
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
      contactInfo: {
        email: "john@example.com",
        id: 1,
        name: "John Doe",
        phone: "123-456-7890",
      },
      contactInfoId: 1,
      createdAt: new Date("2024-01-01"),
      id: 1,
      Job: null,
      jobId: null,
      name: "Software Engineer Resume",
      summary: "[]",
      updatedAt: new Date("2024-01-15"),
      userId: "user-123",
    },
    {
      _count: {
        education: 1,
        experience: 2,
      },
      contactInfo: {
        email: "john@example.com",
        id: 1,
        name: "John Doe",
        phone: "123-456-7890",
      },
      contactInfoId: 1,
      createdAt: new Date("2024-02-01"),
      id: 2,
      Job: {
        company: "Tech Corp",
        createdAt: new Date(),
        description: null,
        id: "job-123",
        notes: null,
        title: "Senior Data Scientist",
        url: "https://example.com/job",
        userId: "user-123",
      },
      jobId: "job-123",
      name: "Data Scientist Resume",
      summary: "[]",
      updatedAt: new Date("2024-02-10"),
      userId: "user-123",
    },
  ];

  const mockJobs = [
    {
      company: "Tech Corp",
      createdAt: new Date(),
      description: null,
      id: "job-123",
      notes: null,
      title: "Senior Data Scientist",
      url: "https://example.com/job",
      userId: "user-123",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseUtils.mockReturnValue({
      resume: {
        list: {
          invalidate: vi.fn(),
        },
      },
    });

    mockListQuery.mockReturnValue({
      data: mockResumes,
      isLoading: false,
    });

    mockGetJobsQuery.mockReturnValue({
      data: mockJobs,
    });

    mockCreateMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });

    mockDeleteMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });

    mockDuplicateMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });
  });

  test("renders resume list", () => {
    render(<ResumePage />);

    expect(screen.getByText("My Resumes")).toBeInTheDocument();
    expect(screen.getByText("Software Engineer Resume")).toBeInTheDocument();
    expect(screen.getByText("Data Scientist Resume")).toBeInTheDocument();
  });

  test("shows loading state", () => {
    mockListQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<ResumePage />);

    expect(screen.getByText("Loading resumes...")).toBeInTheDocument();
  });

  test("shows empty state when no resumes", () => {
    mockListQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<ResumePage />);

    expect(screen.getByText("No resumes yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create your first resume to start building tailored versions.",
      ),
    ).toBeInTheDocument();
  });

  test("displays resume information correctly", () => {
    render(<ResumePage />);

    expect(screen.getByText(/3 roles/)).toBeInTheDocument();
    expect(screen.getByText(/2 entries/)).toBeInTheDocument();
    expect(screen.getByText(/Senior Data Scientist/)).toBeInTheDocument();
  });

  test("opens create modal when clicking create button", () => {
    render(<ResumePage />);

    const createButton = screen.getByText("Create new resume");
    fireEvent.click(createButton);

    expect(screen.getByText("Create New Resume")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g., Software Engineer Resume"),
    ).toBeInTheDocument();
  });

  test("submits a string professional summary when creating a resume", () => {
    const mutate = vi.fn();

    mockCreateMutation.mockReturnValue({
      isPending: false,
      mutate,
    });

    render(<ResumePage />);

    fireEvent.click(screen.getByText("Create new resume"));
    fireEvent.click(screen.getByText("Create Resume"));

    expect(mutate).toHaveBeenCalledWith({
      education: [],
      experience: [],
      jobId: undefined,
      name: "New Resume",
      professionalSummary: "",
    });
  });

  test("renders clickable resume titles without a view button", () => {
    render(<ResumePage />);

    expect(
      screen.getByRole("link", { name: "Software Engineer Resume" }),
    ).toHaveAttribute("href", "/resume/1");
    expect(
      screen.getByRole("link", { name: "Data Scientist Resume" }),
    ).toHaveAttribute("href", "/resume/2");
    expect(screen.queryByText("View")).not.toBeInTheDocument();
  });

  test("does not render duplicate and delete buttons for each resume card", () => {
    render(<ResumePage />);

    expect(screen.queryByText("Duplicate")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });
});
