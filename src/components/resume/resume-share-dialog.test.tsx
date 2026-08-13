import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResumeShareDialog } from "./resume-share-dialog";

const createMutate = vi.fn();
const deleteMutate = vi.fn();
const invalidateQueries = vi.fn();

vi.mock("~/components/ui/toast", () => ({
  toast: { add: vi.fn() },
}));

vi.mock("~/trpc/react", () => ({
  useTRPC: () => ({
    resume: {
      createPermalink: {
        mutationOptions: (options: object) => ({
          ...options,
          mutationKey: ["createPermalink"],
        }),
      },
      deletePermalink: {
        mutationOptions: (options: object) => ({
          ...options,
          mutationKey: ["deletePermalink"],
        }),
      },
      pathFilter: () => ({ queryKey: ["resume"] }),
    },
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: ({ mutationKey }: { mutationKey: string[] }) => ({
    error: null,
    isPending: false,
    mutate: mutationKey[0] === "createPermalink" ? createMutate : deleteMutate,
  }),
  useQueryClient: () => ({ invalidateQueries }),
}));

describe("ResumeShareDialog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a custom public link for the current resume", async () => {
    render(<ResumeShareDialog permalink={null} resumeId="Res001" />);

    fireEvent.click(screen.getByRole("button", { name: "Share resume" }));
    fireEvent.change(screen.getByLabelText("Custom link (optional)"), {
      target: { value: "Jane-Doe" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create link" }));

    await waitFor(() => {
      expect(createMutate).toHaveBeenCalledWith({
        resumeId: "Res001",
        slug: "Jane-Doe",
      });
    });
  });

  it("requires confirmation before revoking a link", async () => {
    render(
      <ResumeShareDialog
        permalink={{ slug: "existing-link" }}
        resumeId="Res001"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Share resume" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete link" }));
    expect(deleteMutate).not.toHaveBeenCalled();

    const confirmationButtons = screen.getAllByRole("button", {
      name: "Delete link",
    });
    fireEvent.click(confirmationButtons.at(-1)!);

    await waitFor(() => {
      expect(deleteMutate).toHaveBeenCalledWith({ resumeId: "Res001" });
    });
  });
});
