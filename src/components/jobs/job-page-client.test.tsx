import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { JobPageClient } from "./job-page-client";

const { mockInvalidateQueries, mockShowModal } = vi.hoisted(() => ({
  mockInvalidateQueries: vi.fn(() => Promise.resolve()),
  mockShowModal: vi.fn((..._args: unknown[]) => Promise.resolve()),
}));

const mockJobs = [
  {
    company: "Acme",
    createdAt: new Date("2026-08-10T12:00:00.000Z"),
    description: null,
    id: "job-1",
    location: "Remote",
    nextActionAt: new Date("2026-08-20T12:00:00.000Z"),
    notes: "Follow up with the hiring manager",
    resume: [{ id: "Res007", name: "Platform resume" }],
    status: "INTERVIEW",
    title: "Staff Engineer",
    updatedAt: new Date("2026-08-10T12:00:00.000Z"),
    url: "https://example.com/job",
    userId: "user-1",
  },
  {
    company: "Globex",
    createdAt: new Date("2026-08-09T12:00:00.000Z"),
    description: null,
    id: "job-2",
    location: null,
    nextActionAt: null,
    notes: null,
    resume: [],
    status: "SAVED",
    title: "Engineering Manager",
    updatedAt: new Date("2026-08-09T12:00:00.000Z"),
    url: "https://example.com/job-2",
    userId: "user-1",
  },
];

vi.mock("~/components/modals/modal", () => ({
  createModal: (component: React.ComponentType) => component,
  showModal: mockShowModal,
}));

vi.mock("~/trpc/react", () => ({
  useTRPC: () => ({
    job: {
      addJob: { mutationOptions: (options: unknown) => options },
      getJobs: { queryOptions: () => ({ queryKey: ["jobs"] }) },
      pathFilter: () => ({ queryKey: ["jobs"] }),
      updateJob: { mutationOptions: (options: unknown) => options },
      updateJobStatus: { mutationOptions: (options: unknown) => options },
    },
    resume: {
      list: {
        queryOptions: () => ({ queryKey: ["resumes"] }),
      },
      pathFilter: () => ({ queryKey: ["resumes"] }),
    },
  }),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useMutation: () => ({
      isPending: false,
      mutate: vi.fn(),
      mutateAsync: vi.fn(() => Promise.resolve()),
    }),
    useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
    useSuspenseQuery: ({ queryKey }: { queryKey: string[] }) => ({
      data:
        queryKey[0] === "jobs"
          ? mockJobs
          : [{ id: "Res007", name: "Platform resume" }],
    }),
  };
});

describe("JobPageClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("shows the application pipeline and linked resume", () => {
    render(<JobPageClient />);

    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Staff Engineer")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Platform resume" }),
    ).toHaveAttribute("href", "/resume/Res007");
    expect(screen.getByText("1", { selector: "p" })).toBeInTheDocument();
  });

  test("filters applications by a user-entered search", () => {
    render(<JobPageClient />);

    fireEvent.change(
      screen.getByRole("textbox", { name: "Search applications" }),
      {
        target: { value: "globex" },
      },
    );

    expect(screen.getByText("Globex")).toBeInTheDocument();
    expect(screen.queryByText("Acme")).not.toBeInTheDocument();
  });

  test("opens the add flow with available resumes", () => {
    render(<JobPageClient />);

    fireEvent.click(screen.getByRole("button", { name: "Add application" }));

    expect(mockShowModal).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        resumes: [{ id: "Res007", name: "Platform resume" }],
      }),
    );
  });
});
