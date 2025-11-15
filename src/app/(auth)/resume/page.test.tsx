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
    // Mock template resumes (with negative IDs)
    {
      _count: {
        education: 1,
        experience: 1,
      },
      contactInfo: null,
      contactInfoId: -1,
      createdAt: new Date("2024-01-01"),
      id: -1,
      Job: null,
      jobId: null,
      name: "Base Template",
      summary: "[]",
      updatedAt: new Date("2024-01-01"),
      userId: "user-123",
    },
    {
      _count: {
        education: 1,
        experience: 1,
      },
      contactInfo: null,
      contactInfoId: -2,
      createdAt: new Date("2024-01-01"),
      id: -2,
      Job: null,
      jobId: null,
      name: "Salesforce Template",
      summary: "[]",
      updatedAt: new Date("2024-01-01"),
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

    expect(
      screen.getByText(
        "No resumes yet. Create your first resume to get started!",
      ),
    ).toBeInTheDocument();
  });

  test("displays resume information correctly", () => {
    render(<ResumePage />);

    expect(screen.getAllByText(/john@example.com/).length).toBeGreaterThan(0);
    expect(screen.getByText(/3 companies/)).toBeInTheDocument();
    expect(screen.getByText(/2 entries/)).toBeInTheDocument();
    expect(screen.getByText(/Senior Data Scientist/)).toBeInTheDocument();
  });

  test("opens create modal when clicking create button", () => {
    render(<ResumePage />);

    const createButton = screen.getByText("+ Create New Resume");
    fireEvent.click(createButton);

    expect(screen.getByText("Create New Resume")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g., Software Engineer Resume"),
    ).toBeInTheDocument();
  });

  test("shows template resumes in the list", () => {
    render(<ResumePage />);

    // Mock templates should appear in the main resume list now
    expect(screen.getByText("Base Template")).toBeInTheDocument();
    expect(screen.getByText("Salesforce Template")).toBeInTheDocument();
  });

  test("renders view and edit links for each resume", () => {
    render(<ResumePage />);

    const viewButtons = screen.getAllByText("View & Edit");
    // 2 user resumes + 2 template resumes = 4 total
    expect(viewButtons).toHaveLength(4);
  });

  test("renders duplicate and delete buttons for each resume", () => {
    render(<ResumePage />);

    const duplicateButtons = screen.getAllByText("Duplicate");
    const deleteButtons = screen.getAllByText("Delete");

    // Only user resumes (not templates) should have duplicate/delete buttons
    expect(duplicateButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });
});
