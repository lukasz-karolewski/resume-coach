import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, test, vi } from "vitest";
import ResumeDetailClient from "./resume-detail-client";

const mockPush = vi.fn();
const mockUpdateTitleMutation = vi.fn();
const mockDuplicateMutation = vi.fn();
const mockDeleteMutation = vi.fn();
const mockUseUtils = vi.fn();
const mockFetch = vi.fn();
const mockClipboardWriteText = vi.fn();
const mockPrint = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
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
  default: () => <div>Experience</div>,
}));

vi.mock("~/components/resume/professional-summary", () => ({
  ProfessionalSummary: () => <div>Summary</div>,
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
  api: {
    resume: {
      delete: {
        useMutation: (opts: unknown) => mockDeleteMutation(opts),
      },
      duplicate: {
        useMutation: (opts: unknown) => mockDuplicateMutation(opts),
      },
      updateTitle: {
        useMutation: (opts: unknown) => mockUpdateTitleMutation(opts),
      },
    },
    useUtils: () => mockUseUtils(),
  },
}));

describe("ResumeDetailClient", () => {
  const resume = {
    contactInfo: {
      email: "jane@example.com",
      name: "Jane Doe",
      phone: "123",
    },
    education: [],
    experience: [],
    id: 7,
    name: "Platform Resume",
    summary: "Summary",
  };

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
    mockUseUtils.mockReturnValue({
      resume: {
        list: { invalidate: vi.fn() },
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
  });

  test("renders an inline title input without edit controls", () => {
    render(<ResumeDetailClient resume={resume} />);

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
      screen.getByRole("button", { name: /delete resume/i }),
    ).toBeInTheDocument();
  });

  test("copies the resume markdown from the toolbar", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue("# Resume markdown"),
    });
    mockClipboardWriteText.mockResolvedValue(undefined);

    render(<ResumeDetailClient resume={resume} />);

    fireEvent.click(screen.getByRole("button", { name: /copy as markdown/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/resume/7/markdown");
      expect(mockClipboardWriteText).toHaveBeenCalledWith("# Resume markdown");
      expect(toast.success).toHaveBeenCalledWith("Copied markdown");
    });
  });

  test("autosaves the title after the input changes", async () => {
    vi.useFakeTimers();
    const mutate = vi.fn();
    mockUpdateTitleMutation.mockReturnValue({
      isPending: false,
      mutate,
    });

    render(<ResumeDetailClient resume={resume} />);

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
    render(<ResumeDetailClient resume={resume} />);

    fireEvent.click(screen.getByRole("button", { name: /print resume/i }));

    expect(mockPrint).toHaveBeenCalled();
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

    render(<ResumeDetailClient resume={resume} />);

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

    render(<ResumeDetailClient resume={resume} />);

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

    render(<ResumeDetailClient resume={resume} />);

    fireEvent.click(screen.getByRole("button", { name: /delete resume/i }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({ id: 7 });
    });
  });
});
