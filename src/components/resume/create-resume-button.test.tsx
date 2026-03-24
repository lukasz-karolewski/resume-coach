import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import CreateResumeButton from "./create-resume-button";

const mockPushRefresh = vi.fn();
const mockGetJobsQuery = vi.fn();
const mockCreateMutation = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockPushRefresh,
  }),
}));

vi.mock("~/trpc/react", () => ({
  api: {
    job: {
      getJobs: {
        useQuery: () => mockGetJobsQuery(),
      },
    },
    resume: {
      create: {
        useMutation: (opts: unknown) => mockCreateMutation(opts),
      },
    },
  },
}));

describe("CreateResumeButton", () => {
  const mockJobs = [
    {
      company: "Tech Corp",
      id: "job-123",
      title: "Senior Data Scientist",
      url: "https://example.com/job",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetJobsQuery.mockReturnValue({
      data: mockJobs,
    });

    mockCreateMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });
  });

  test("opens the create modal from the trigger button", () => {
    render(<CreateResumeButton />);

    fireEvent.click(screen.getByRole("button", { name: "Create new resume" }));

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

    render(<CreateResumeButton />);

    fireEvent.click(screen.getByRole("button", { name: "Create new resume" }));
    fireEvent.click(screen.getByRole("button", { name: "Create Resume" }));

    expect(mutate).toHaveBeenCalledWith({
      education: [],
      experience: [],
      jobId: undefined,
      name: "New Resume",
      professionalSummary: "",
    });
  });

  test("refreshes the route after a successful create", async () => {
    let mutationOptions:
      | {
          onSuccess?: () => void;
        }
      | undefined;
    const mutate = vi.fn(() => {
      mutationOptions?.onSuccess?.();
    });

    mockCreateMutation.mockImplementation((opts) => {
      mutationOptions = opts as typeof mutationOptions;
      return {
        isPending: false,
        mutate,
      };
    });

    render(<CreateResumeButton />);

    fireEvent.click(screen.getByRole("button", { name: "Create new resume" }));
    fireEvent.click(screen.getByRole("button", { name: "Create Resume" }));

    await waitFor(() => {
      expect(mockPushRefresh).toHaveBeenCalled();
    });
  });
});
