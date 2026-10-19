import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { toast } from "~/components/ui/toast";
import ResumeDetailClient from "./resume-detail-client";

const mockPush = vi.fn();
const mockUpdateTitleMutation = vi.fn();
const mockAddSectionItemMutation = vi.fn();
const mockDeleteSectionItemMutation = vi.fn();
const mockDuplicateMutation = vi.fn();
const mockDeleteMutation = vi.fn();
const mockRemoveSectionMutation = vi.fn();
const mockUpdateSectionItemMutation = vi.fn();
const mockUpdateSummaryMutation = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockFetch = vi.fn();
const mockClipboardWriteText = vi.fn();
const mockPrint = vi.fn();
const mockUseSuspenseQuery = vi.fn();
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
      resumeId: "Res007",
    },
  ],
  id: "Res007",
  name: "Platform Resume",
  patents: [],
  permalink: null,
  sections: [],
  skills: [],
  summary: "Summary",
};

vi.mock("~/components/resume/resume-share-dialog", () => ({
  ResumeShareDialog: () => null,
}));

vi.mock("~/components/resume/resume-pdf-viewer-lazy", () => ({
  createResumePdfViewer: () =>
    function MockResumePdfViewer({ resume }: { resume: { name: string } }) {
      return <div data-testid="pdf-viewer">{resume.name}</div>;
    },
}));

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
    onDeletePosition,
    onEditPosition,
  }: {
    jobs: typeof mockResume.experience;
    onDeletePosition?: (
      position: (typeof mockResume.experience)[number]["positions"][number],
    ) => void;
    onEditPosition?: (
      position: (typeof mockResume.experience)[number]["positions"][number],
      companyName: string,
    ) => void;
  }) => (
    <div>
      <span>{jobs[0]?.positions[0]?.accomplishments}</span>
      <button
        type="button"
        onClick={() => {
          const position = jobs[0]?.positions[0];
          if (position) onEditPosition?.(position, jobs[0]?.companyName ?? "");
        }}
      >
        Edit test experience
      </button>
      <button
        type="button"
        onClick={() => {
          const position = jobs[0]?.positions[0];
          if (position) onDeletePosition?.(position);
        }}
      >
        Delete test experience
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
    action,
    children,
    title,
  }: {
    action?: React.ReactNode;
    children: React.ReactNode;
    title: string;
  }) => (
    <section>
      <div>
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  ),
}));

vi.mock("~/trpc/react", () => ({
  useTRPC: () => ({
    resume: {
      addSectionItem: {
        mutationOptions: (opts: unknown) => ({
          ...(opts as object),
          mutationKey: ["addSectionItem"],
        }),
      },
      delete: {
        mutationOptions: (opts: unknown) => ({
          ...(opts as object),
          mutationKey: ["delete"],
        }),
      },
      deleteSectionItem: {
        mutationOptions: (opts: unknown) => ({
          ...(opts as object),
          mutationKey: ["deleteSectionItem"],
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
      removeSection: {
        mutationOptions: (opts: unknown) => ({
          ...(opts as object),
          mutationKey: ["removeSection"],
        }),
      },
      updateSectionItem: {
        mutationOptions: (opts: unknown) => ({
          ...(opts as object),
          mutationKey: ["updateSectionItem"],
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
    if (options.mutationKey[0] === "addSectionItem") {
      return mockAddSectionItemMutation(options);
    }
    if (options.mutationKey[0] === "delete") {
      return mockDeleteMutation(options);
    }
    if (options.mutationKey[0] === "deleteSectionItem") {
      return mockDeleteSectionItemMutation(options);
    }
    if (options.mutationKey[0] === "duplicate") {
      return mockDuplicateMutation(options);
    }
    if (options.mutationKey[0] === "removeSection") {
      return mockRemoveSectionMutation(options);
    }
    if (options.mutationKey[0] === "updateSectionItem") {
      return mockUpdateSectionItemMutation(options);
    }
    if (options.mutationKey[0] === "updateSummary") {
      return mockUpdateSummaryMutation(options);
    }
    return mockUpdateTitleMutation(options);
  },
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  useSuspenseQuery: () => mockUseSuspenseQuery(),
}));

async function openResumeActions() {
  fireEvent.click(screen.getByRole("button", { name: "Resume actions" }));
  return screen.findByRole("menu");
}

async function pickResumeAction(name: RegExp | string) {
  const menu = await openResumeActions();
  fireEvent.click(within(menu).getByRole("menuitem", { name }));
}

describe("ResumeDetailClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSuspenseQuery.mockReturnValue({ data: mockResume });
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
    mockAddSectionItemMutation.mockReturnValue({
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
    mockDeleteSectionItemMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });
    mockRemoveSectionMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });
    mockUpdateSectionItemMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });
    mockUpdateSummaryMutation.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    });
  });

  test("exposes the resume name as an editable input and links to the preview from its menu", async () => {
    render(<ResumeDetailClient resumeId={"Res007"} />);

    expect(screen.getByRole("textbox", { name: "Resume name" })).toHaveValue(
      "Platform Resume",
    );
    const menu = await openResumeActions();
    expect(
      within(menu).getByRole("menuitem", { name: "Preview" }),
    ).toHaveAttribute("href", "/resume/Res007/preview");
  });

  test("keeps only print standing in the toolbar and tucks secondary actions into the title menu", () => {
    render(<ResumeDetailClient resumeId={"Res007"} />);

    expect(
      screen.getByRole("button", { name: /print resume/i }),
    ).toBeInTheDocument();
    for (const name of [
      /add section/i,
      /preview/i,
      /copy as markdown/i,
      /duplicate/i,
      /delete resume/i,
    ]) {
      expect(screen.queryByRole("button", { name })).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name })).not.toBeInTheDocument();
    }
  });

  test("collects initial content before adding a section", async () => {
    let onSuccess: ((updatedResume: unknown) => void) | undefined;
    const mutate = vi.fn(() => {
      onSuccess?.({
        ...mockResume,
        patents: [
          {
            date: new Date("2021-06-01T00:00:00.000Z"),
            description: "Reduced stale reads in distributed systems.",
            id: 21,
            link: null,
            resumeId: "Res007",
            title: "Adaptive cache invalidation",
          },
        ],
        sections: [
          { id: 22, resumeId: "Res007", title: "Patents", type: "PATENTS" },
        ],
      });
    });
    mockAddSectionItemMutation.mockImplementation((options) => {
      onSuccess = (options as { onSuccess?: (updatedResume: unknown) => void })
        .onSuccess;
      return { isPending: false, mutate };
    });

    render(<ResumeDetailClient resumeId={"Res007"} />);

    fireEvent.click(
      within(await openResumeActions()).getByRole("menuitem", {
        name: "Add section",
      }),
    );

    expect(
      screen.getByRole("menuitem", { name: /experience/i }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("menuitem", { name: "Education" })).toBeEnabled();
    expect(
      screen.getByRole("menuitem", { name: "Certifications" }),
    ).toBeEnabled();
    expect(screen.getByRole("menuitem", { name: "Skills" })).toBeEnabled();

    fireEvent.click(screen.getByRole("menuitem", { name: "Patents" }));

    expect(
      await screen.findByRole("heading", { name: "Add patent" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Patent title"), {
      target: { value: "Adaptive cache invalidation" },
    });
    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2021-06" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Reduced stale reads in distributed systems." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add patent" }));

    expect(mutate).toHaveBeenCalledWith({
      date: "2021-06",
      description: "Reduced stale reads in distributed systems.",
      resumeId: "Res007",
      title: "Adaptive cache invalidation",
      type: "PATENTS",
    });
    expect(
      await screen.findByText("Adaptive cache invalidation"),
    ).toBeInTheDocument();
  });

  test("adds another item to an existing section", async () => {
    const mutate = vi.fn();
    mockAddSectionItemMutation.mockReturnValue({ isPending: false, mutate });

    render(<ResumeDetailClient resumeId={"Res007"} />);

    fireEvent.click(screen.getByRole("button", { name: "Add experience" }));

    expect(
      await screen.findByRole("heading", { name: "Add experience" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Company"), {
      target: { value: "Globex" },
    });
    fireEvent.change(screen.getByLabelText("Role"), {
      target: { value: "Principal Engineer" },
    });
    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "Remote" },
    });
    fireEvent.change(screen.getByLabelText("Start date"), {
      target: { value: "2024-01" },
    });
    fireEvent.change(screen.getByLabelText("Accomplishments"), {
      target: { value: "- Built a resilient platform" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add experience" }));

    expect(mutate).toHaveBeenCalledWith({
      accomplishments: "- Built a resilient platform",
      companyName: "Globex",
      location: "Remote",
      resumeId: "Res007",
      roleTitle: "Principal Engineer",
      startDate: "2024-01",
      type: "EXPERIENCE",
    });
  });

  test("copies the resume markdown from the title menu", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue("# Resume markdown"),
    });
    mockClipboardWriteText.mockResolvedValue(undefined);

    render(<ResumeDetailClient resumeId={"Res007"} />);

    await pickResumeAction("Copy as markdown");

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/resume/Res007/markdown");
      expect(mockClipboardWriteText).toHaveBeenCalledWith("# Resume markdown");
      expect(toast.add).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" }),
      );
    });
  });

  test("autosaves the title after the input changes", async () => {
    vi.useFakeTimers();
    const mutate = vi.fn();
    mockUpdateTitleMutation.mockReturnValue({
      isPending: false,
      mutate,
    });

    render(<ResumeDetailClient resumeId={"Res007"} />);

    const input = screen.getByLabelText("Resume name");
    fireEvent.change(input, { target: { value: "Platform Resume v2" } });
    expect(mutate).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(800);
    });

    expect(mutate).toHaveBeenCalledWith({
      id: "Res007",
      name: "Platform Resume v2",
    });

    vi.useRealTimers();
  });

  test("print opens the resume PDF full screen instead of the browser print dialog", async () => {
    render(<ResumeDetailClient resumeId={"Res007"} />);

    fireEvent.click(screen.getByRole("button", { name: /print resume/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByTestId("pdf-viewer")).toHaveTextContent(
      mockResume.name,
    );
    expect(mockPrint).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  test("cancelling the delete confirmation closes it without deleting", async () => {
    const mutate = vi.fn();
    mockDeleteMutation.mockReturnValue({ isPending: false, mutate });

    render(<ResumeDetailClient resumeId={"Res007"} />);

    await pickResumeAction("Delete");

    expect(await screen.findByRole("alertdialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(mutate).not.toHaveBeenCalled();
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

    render(<ResumeDetailClient resumeId={"Res007"} />);

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

  test("duplicates the resume from the title menu", async () => {
    const mutate = vi.fn();
    mockDuplicateMutation.mockReturnValue({
      isPending: false,
      mutate,
    });

    render(<ResumeDetailClient resumeId={"Res007"} />);

    await pickResumeAction("Duplicate");

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({
        id: "Res007",
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

    render(<ResumeDetailClient resumeId={"Res007"} />);

    await pickResumeAction("Delete");
    expect(mutate).not.toHaveBeenCalled();
    fireEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Delete",
      }),
    );

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledWith({ id: "Res007" });
    });
  });

  test("edits all experience details in the section-item modal", async () => {
    let mutationOptions:
      | {
          onSuccess?: (
            data: unknown,
            variables: {
              accomplishments: string;
              companyName: string;
              itemId: number;
              location: string;
              resumeId: string;
              roleTitle: string;
              startDate: string;
              type: "EXPERIENCE";
            },
          ) => void | Promise<void>;
        }
      | undefined;
    const mutate = vi.fn(
      (variables: {
        accomplishments: string;
        companyName: string;
        itemId: number;
        location: string;
        resumeId: string;
        roleTitle: string;
        startDate: string;
        type: "EXPERIENCE";
      }) => {
        void mutationOptions?.onSuccess?.(mockResume, variables);
      },
    );

    mockUpdateSectionItemMutation.mockImplementation((opts) => {
      mutationOptions = opts as typeof mutationOptions;
      return { isPending: false, mutate };
    });

    render(<ResumeDetailClient resumeId={"Res007"} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Edit test experience" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Edit experience" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Company")).toHaveValue("Acme");
    const editor = screen.getByLabelText("Accomplishments");
    fireEvent.change(editor, {
      target: { value: "- Reduced deployment time by 80%" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(mutate).toHaveBeenCalledWith({
      accomplishments: "- Reduced deployment time by 80%",
      companyName: "Acme",
      itemId: 34,
      location: "Remote",
      resumeId: "Res007",
      roleTitle: "Staff Engineer",
      startDate: "2022-01",
      type: "EXPERIENCE",
    });
  });

  test("deletes an item from its own control", () => {
    const mutate = vi.fn();
    mockDeleteSectionItemMutation.mockReturnValue({ isPending: false, mutate });

    render(<ResumeDetailClient resumeId={"Res007"} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Delete test experience" }),
    );

    expect(mutate).toHaveBeenCalledWith({
      itemId: 34,
      resumeId: "Res007",
      type: "EXPERIENCE",
    });
  });

  test("removes a section only once it is empty", () => {
    const mutate = vi.fn();
    mockRemoveSectionMutation.mockReturnValue({ isPending: false, mutate });
    mockUseSuspenseQuery.mockReturnValue({
      data: {
        ...mockResume,
        sections: [
          { id: 22, resumeId: "Res007", title: "Patents", type: "PATENTS" },
        ],
      },
    });

    render(<ResumeDetailClient resumeId={"Res007"} />);

    expect(
      screen.queryByRole("button", { name: "Remove Experience section" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Remove Patents section" }),
    );

    expect(mutate).toHaveBeenCalledWith({
      resumeId: "Res007",
      type: "PATENTS",
    });
  });

  test("edits the professional summary in a modal", async () => {
    let mutationOptions:
      | {
          onSuccess?: (
            data: unknown,
            variables: { resumeId: string; summary: string },
          ) => void | Promise<void>;
        }
      | undefined;
    const mutate = vi.fn((variables: { resumeId: string; summary: string }) => {
      void mutationOptions?.onSuccess?.({}, variables);
    });

    mockUpdateSummaryMutation.mockImplementation((opts) => {
      mutationOptions = opts as typeof mutationOptions;
      return { isPending: false, mutate };
    });

    render(<ResumeDetailClient resumeId={"Res007"} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit test summary" }));
    const editor = await screen.findByLabelText("Professional summary");
    fireEvent.change(editor, {
      target: { value: "Platform engineer focused on reliable delivery." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(mutate).toHaveBeenCalledWith({
      resumeId: "Res007",
      summary: "Platform engineer focused on reliable delivery.",
    });
    await waitFor(() => {
      expect(
        screen.getByText("Platform engineer focused on reliable delivery."),
      ).toBeInTheDocument();
    });
  });
});
