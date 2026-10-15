import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import CreateResumeButton from "./create-resume-button";

const mockGetJobsQuery = vi.fn();
const mockGetProfileQuery = vi.fn();
const mockCreateMutation = vi.fn();
const mockCreateTailoredMutation = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock("~/trpc/react", () => ({
  useTRPC: () => ({
    job: {
      getJobs: {
        queryOptions: () => ({ queryKey: ["job"] }),
      },
    },
    profile: {
      getAccomplishmentProfile: {
        queryOptions: () => ({ queryKey: ["profile"] }),
      },
    },
    resume: {
      create: {
        mutationOptions: (opts: unknown) => ({
          ...(opts as object),
          mutationKey: ["create"],
        }),
      },
      createTailoredFromProfile: {
        mutationOptions: (opts: unknown) => ({
          ...(opts as object),
          mutationKey: ["tailored"],
        }),
      },
      pathFilter: () => ({ queryKey: ["resume"] }),
    },
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: { mutationKey: string[] }) =>
    options.mutationKey[0] === "create"
      ? mockCreateMutation(options)
      : mockCreateTailoredMutation(options),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  useSuspenseQuery: ({ queryKey }: { queryKey: string[] }) =>
    queryKey[0] === "job" ? mockGetJobsQuery() : mockGetProfileQuery(),
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
    mockGetProfileQuery.mockReturnValue({
      data: {
        roles: [
          {
            id: 1,
          },
        ],
      },
    });

    mockCreateMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });
    mockCreateTailoredMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });
  });

  test("submits the entered resume name", () => {
    const mutate = vi.fn();
    mockCreateMutation.mockReturnValue({ isPending: false, mutate });

    render(<CreateResumeButton />);

    fireEvent.click(screen.getByRole("button", { name: "Create new resume" }));
    fireEvent.change(document.getElementById("resume-name")!, {
      target: { value: "Platform Resume" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Resume" }));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Platform Resume" }),
    );
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

  test("invalidates resume data after create settles", async () => {
    let mutationOptions:
      | {
          onSettled?: () => Promise<void>;
        }
      | undefined;
    const mutate = vi.fn(() => {
      void mutationOptions?.onSettled?.();
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
      expect(mockInvalidateQueries).toHaveBeenCalledWith({
        queryKey: ["resume"],
      });
    });
  });

  test("generates a tailored resume when a job is selected and the profile has accomplishments", async () => {
    const mutate = vi.fn();
    mockCreateTailoredMutation.mockReturnValue({ isPending: false, mutate });

    render(<CreateResumeButton />);

    fireEvent.click(screen.getByRole("button", { name: "Create new resume" }));
    expect(
      screen.queryByRole("button", { name: "Generate from profile" }),
    ).not.toBeInTheDocument();
    fireEvent.click(document.getElementById("resume-job")!);

    const option = await screen.findByRole("option", {
      name: "Senior Data Scientist",
    });
    // Base UI only commits a mouse click that started on the item itself.
    fireEvent.pointerDown(option, { pointerType: "mouse" });
    fireEvent.click(option);

    fireEvent.click(
      await screen.findByRole("button", { name: "Generate from profile" }),
    );

    expect(mutate).toHaveBeenCalledWith({ jobId: "job-123", name: undefined });
  });
});
