import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { toast } from "~/components/ui/toast";
import ResumeDetailClient from "./resume-detail-client";

const mockPush = vi.fn();
const mockUpdateTitleMutation = vi.fn();
const mockDuplicateMutation = vi.fn();
const mockDeleteMutation = vi.fn();
const mockUpdateAccomplishmentsMutation = vi.fn();
const mockUpdateSummaryMutation = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockFetch = vi.fn();
const mockClipboardWriteText = vi.fn();
const mockPrint = vi.fn();
const mockResume = {
  contactInfo: {
    email: "jane@example.com",
    name: "Jane Doe",
    phone: "123",
  },
  education: [],
  experience: [
    {
      companyName: "Acme",
      id: 12,
      link: null,
      positions: [
        {
          accomplishments: "- Reduced deployment time by 50%",
          endDate: null,
          experienceId: 12,
          id: 34,
          location: "Remote",
          skillPosition: [],
          startDate: new Date("2022-01-01T00:00:00.000Z"),
          title: "Staff Engineer",
        },
      ],
      resumeId: 7,
    },
  ],
  id: 7,
  name: "Platform Resume",
  summary: "Summary",
};

vi.mock("~/components/ui/toast", () => ({
  toast: {
    add: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("~/components/resume/contact-info", () => ({
  default: () => <div>Contact info</div>,
}));

vi.mock("~/components/resume/education-experience", () => ({
  default: () => <div>Education</div>,
}));

vi.mock("~/components/resume/job-experience", () => ({
  default: ({
    jobs,
    onEditAccomplishments,
  }: {
    jobs: typeof mockResume.experience;
    onEditAccomplishments?: (
      position: (typeof mockResume.experience)[number]["positions"][number],
    ) => void;
  }) => (
    <div>
      <span>{jobs[0]?.positions[0]?.accomplishments}</span>
      <button
        type="button"
        onClick={() => {
          const position = jobs[0]?.positions[0];
          if (position) onEditAccomplishments?.(position);
        }}
      >
        Edit test accomplishments
      </button>
    </div>
  ),
}));

vi.mock("~/components/resume/professional-summary", () => ({
  ProfessionalSummary: ({
    info,
    onEdit,
  }: {
    info: string;
    onEdit?: () => void;
  }) => (
    <div>
      <span>{info}</span>
      <button type="button" onClick={onEdit}>
        Edit test summary
      </button>
    </div>
  ),
}));

vi.mock("~/components/resume/section", () => ({
  default: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
  }) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
}));

vi.mock("~/trpc/react", () => ({
  useTRPC: () => ({
    resume: {
      delete: {
        mutationOptions: (opts: unknown) => ({
          ...(opts as object),
          mutationKey: ["delete"],
        }),
      },
      duplicate: {
        mutationOptions: (opts: unknown) => ({
          ...(opts as object),
          mutationKey: ["duplicate"],
        }),
      },
      getById: {
        queryOptions: (input: unknown) => ({ input, queryKey: ["detail"] }),
      },
      pathFilter: () => ({ queryKey: ["resume"] }),
      updateAccomplishments: {
        mutationOptions: (opts: unknown) => ({
          ...(opts as object),
          mutationKey: ["updateAccomplishments"],
        }),
      },
      updateSummary: {
        mutationOptions: (opts: unknown) => ({
          ...(opts as object),
          mutationKey: ["updateSummary"],
        }),
      },
      updateTitle: {
        mutationOptions: (opts: unknown) => ({
          ...(opts as object),
          mutationKey: ["updateTitle"],
        }),
      },
    },
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: { mutationKey: string[] }) => {
    if (options.mutationKey[0] === "delete") {
      return mockDeleteMutation(options);
    }
    if (options.mutationKey[0] === "duplicate") {
      return mockDuplicateMutation(options);
    }
    if (options.mutationKey[0] === "updateAccomplishments") {
      return mockUpdateAccomplishmentsMutation(options);
    }
    if (options.mutationKey[0] === "updateSummary") {
      return mockUpdateSummaryMutation(options);
    }
    return mockUpdateTitleMutation(options);
  },
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  useSuspenseQuery: () => ({ data: mockResume }),
}));

describe("ResumeDetailClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    Object.assign(window, {
      print: mockPrint,
    });
    Object.assign(navigator, {
      clipboard: {
        writeText: mockClipboardWriteText,
      },
    });
    mockUpdateTitleMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });
    mockDuplicateMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });
    mockDeleteMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });
    mockUpdateAccomplishmentsMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });
    mockUpdateSummaryMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });
  });

  test("renders an inline title input without edit controls", () => {
    render(<ResumeDetailClient resumeId={7} />);

    const input = screen.getByLabelText("Resume name");

    expect(input).toBeInTheDocument();
    expect(input).toHaveClass(
      "w-auto",
      "rounded-none",
      "border-0",
      "border-b",
      "[field-sizing:content]",
    );
    expect(
      screen.queryByRole("button", { name: /edit resume name/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save resume name/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /duplicate resume/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /copy as markdown/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /print resume/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /preview resume/i }),
    ).toHaveAttribute("href", "/resume/7/preview");
    expect(
      screen.getByRole("button", { name: /delete resume/i }),
    ).toBeInTheDocument();
  });

  test("copies the resume markdown from the toolbar", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue("# Resume markdown"),
    });
    mockClipboardWriteText.mockResolvedValue(undefined);

    render(<ResumeDetailClient resumeId={7} />);

    fireEvent.click(screen.getByRole("button", { name: /copy as markdown/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/resume/7/markdown");
      expect(mockClipboardWriteText).toHaveBeenCalledWith("# Resume markdown");
      expect(toast.add).toHaveBeenCalledWith({
        title: "Copied markdown",
        type: "success",
      });
    });
  });

  test("autosaves the title after the input changes", async () => {
    vi.useFakeTimers();
    const mutate = vi.fn();
    mockUpdateTitleMutation.mockReturnValue({
      isPending: false,
      mutate,
    });

    render(<ResumeDetailClient resumeId={7} />);

    const input = screen.getByLabelText("Resume name");
    fireEvent.change(input, { target: { value: "Platform Resume v2" } });
    expect(mutate).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    expect(mutate).toHaveBeenCalledWith({
      id: 7,
      name: "Platform Resume v2",
    });

    vi.useRealTimers();
  });

  test("opens the browser print dialog from the toolbar", () => {
    render(<ResumeDetailClient resumeId={7} />);

    fireEvent.click(screen.getByRole("button", { name: /print resume/i }));

    expect(mockPrint).toHaveBeenCalled();
  });

  test("opens and cancels the delete confirmation dialog", async () => {
    render(<ResumeDetailClient resumeId={7} />);

    fireEvent.click(screen.getByRole("button", { name: /delete resume/i }));

    expect(
      await screen.findByRole("heading", { name: "Delete resume?" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: "Delete resume?" }),
      ).not.toBeInTheDocument();
    });
  });

  test("shows a transient saved indicator after title autosave succeeds", async () => {
    vi.useFakeTimers();
    let mutationOptions:
      | {
          onSuccess?: (updatedResume: { name: string }) => void | Promise<void>;
        }
      | undefined;
    const mutate = vi.fn(() => {
      void mutationOptions?.onSuccess?.({
        name: "Platform Resume v2",
      });
    });

    mockUpdateTitleMutation.mockImplementation((opts) => {
      mutationOptions = opts as typeof mutationOptions;
      return {
        isPending: false,
        mutate,
      };
    });

    render(<ResumeDetailClient resumeId={7} />);

    fireEvent.change(screen.getByLabelText("Resume name"), {
      target: { value: "Platform Resume v2" },
    });

    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    expect(screen.getByLabelText(/saved/i)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.queryByLabelText(/saved/i)).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  test("duplicates the resume from the toolbar", async () => {
    const mutate = vi.fn();
    mockDuplicateMutation.mockReturnValue({
      isPending: false,
      mutate,
    });

    render(<ResumeDetailClient resumeId={7} />);

    fireEvent.click(screen.getByRole("button", { name: /duplicate resume/i }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        id: 7,
        name: "Platform Resume (Copy)",
      });
    });
  });

  test("deletes the resume through the alert dialog", async () => {
    const mutate = vi.fn();
    mockDeleteMutation.mockReturnValue({
      isPending: false,
      mutate,
    });

    render(<ResumeDetailClient resumeId={7} />);

    fireEvent.click(screen.getByRole("button", { name: /delete resume/i }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({ id: 7 });
    });
  });

  test("edits a position's accomplishments in a modal", async () => {
    let mutationOptions:
      | {
          onSuccess?: (
            data: unknown,
            variables: { accomplishments: string; positionId: number },
          ) => void | Promise<void>;
        }
      | undefined;
    const mutate = vi.fn(
      (variables: { accomplishments: string; positionId: number }) => {
        void mutationOptions?.onSuccess?.({}, variables);
      },
    );

    mockUpdateAccomplishmentsMutation.mockImplementation((opts) => {
      mutationOptions = opts as typeof mutationOptions;
      return { isPending: false, mutate };
    });

    render(<ResumeDetailClient resumeId={7} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Edit test accomplishments" }),
    );
    const editor = await screen.findByLabelText("Accomplishments");
    fireEvent.change(editor, {
      target: { value: "- Reduced deployment time by 80%" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(mutate).toHaveBeenCalledWith({
      accomplishments: "- Reduced deployment time by 80%",
      positionId: 34,
    });
    await waitFor(() => {
      expect(
        screen.getByText("- Reduced deployment time by 80%"),
      ).toBeInTheDocument();
    });
  });

  test("edits the professional summary in a modal", async () => {
    let mutationOptions:
      | {
          onSuccess?: (
            data: unknown,
            variables: { resumeId: number; summary: string },
          ) => void | Promise<void>;
        }
      | undefined;
    const mutate = vi.fn((variables: { resumeId: number; summary: string }) => {
      void mutationOptions?.onSuccess?.({}, variables);
    });

    mockUpdateSummaryMutation.mockImplementation((opts) => {
      mutationOptions = opts as typeof mutationOptions;
      return { isPending: false, mutate };
    });

    render(<ResumeDetailClient resumeId={7} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit test summary" }));
    const editor = await screen.findByLabelText("Professional summary");
    fireEvent.change(editor, {
      target: { value: "Platform engineer focused on reliable delivery." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(mutate).toHaveBeenCalledWith({
      resumeId: 7,
      summary: "Platform engineer focused on reliable delivery.",
    });
    await waitFor(() => {
      expect(
        screen.getByText("Platform engineer focused on reliable delivery."),
      ).toBeInTheDocument();
    });
  });
});
