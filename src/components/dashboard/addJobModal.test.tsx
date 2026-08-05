import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AddJobModal } from "./addJobModal";

const mockInvalidateQueries = vi.fn();
const mockRemove = vi.fn();
const mockResolve = vi.fn();

vi.mock("@ebay/nice-modal-react", () => ({
  default: {
    create: (component: React.ComponentType) => component,
  },
  useModal: () => ({
    remove: mockRemove,
    resolve: mockResolve,
    visible: true,
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: { onSettled?: () => Promise<void> }) => ({
    mutate: () => {
      void options.onSettled?.();
    },
  }),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock("~/trpc/react", () => ({
  useTRPC: () => ({
    job: {
      addJob: { mutationOptions: (options: unknown) => options },
      pathFilter: () => ({ queryKey: ["job"] }),
    },
  }),
}));

vi.mock("~/components/ui/modal", () => ({
  default: ({
    children,
    title,
  }: {
    children: React.ReactNode;
    title: string;
  }) => (
    <div role="dialog" aria-label={title}>
      {children}
    </div>
  ),
}));

describe("AddJobModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("invalidates job data after the mutation settles", async () => {
    render(<AddJobModal />);

    const urlInput =
      document.querySelector<HTMLInputElement>('input[name="url"]');
    expect(urlInput).not.toBeNull();
    fireEvent.change(urlInput as HTMLInputElement, {
      target: { value: "https://example.com/job" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["job"] });
    });
  });
});
