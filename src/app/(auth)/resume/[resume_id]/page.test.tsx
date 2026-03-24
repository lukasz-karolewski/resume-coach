import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import ResumeDetailPage from "./page";

const mockPush = vi.fn();
const mockGetByIdQuery = vi.fn();
const mockUpdateMutation = vi.fn();
const mockDuplicateMutation = vi.fn();
const mockDeleteMutation = vi.fn();
const mockUseUtils = vi.fn();

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
      getById: {
        useQuery: () => mockGetByIdQuery(),
      },
      update: {
        useMutation: (opts: unknown) => mockUpdateMutation(opts),
      },
    },
    useUtils: () => mockUseUtils(),
  },
}));

describe("ResumeDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUtils.mockReturnValue({
      resume: {
        getById: { invalidate: vi.fn() },
        list: { invalidate: vi.fn() },
      },
    });

    mockGetByIdQuery.mockReturnValue({
      data: {
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
      },
    });
    mockUpdateMutation.mockReturnValue({
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

  test("renders icon-only toolbar actions", () => {
    render(<ResumeDetailPage params={{ resume_id: "7" }} />);

    expect(
      screen.getByRole("button", { name: /edit resume name/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /duplicate resume/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /delete resume/i }),
    ).toBeInTheDocument();
  });

  test("renames a resume inline", async () => {
    const mutate = vi.fn();
    mockUpdateMutation.mockReturnValue({
      isPending: false,
      mutate,
    });

    render(<ResumeDetailPage params={{ resume_id: "7" }} />);

    fireEvent.click(screen.getByRole("button", { name: /edit resume name/i }));
    const input = screen.getByLabelText("Resume name");
    fireEvent.change(input, { target: { value: "Platform Resume v2" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        id: 7,
        name: "Platform Resume v2",
      });
    });
  });

  test("duplicates the resume from the toolbar", async () => {
    const mutate = vi.fn();
    mockDuplicateMutation.mockReturnValue({
      isPending: false,
      mutate,
    });

    render(<ResumeDetailPage params={{ resume_id: "7" }} />);

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

    render(<ResumeDetailPage params={{ resume_id: "7" }} />);

    fireEvent.click(screen.getByRole("button", { name: /delete resume/i }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({ id: 7 });
    });
  });
});
