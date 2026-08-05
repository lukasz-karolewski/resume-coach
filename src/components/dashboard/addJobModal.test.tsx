import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { AddJobModal } from "./addJobModal";

const mockRemove = vi.fn();
const mockReject = vi.fn();
const mockResolve = vi.fn();

vi.mock("@ebay/nice-modal-react", () => ({
  default: {
    create: (component: React.ComponentType) => component,
  },
  useModal: () => ({
    reject: mockReject,
    remove: mockRemove,
    resolve: mockResolve,
    visible: true,
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

  test("resolves the entered url and lets the caller run the mutation", async () => {
    render(<AddJobModal id="add-job-test" />);

    const urlInput =
      document.querySelector<HTMLInputElement>('input[name="url"]');
    expect(urlInput).not.toBeNull();
    fireEvent.change(urlInput as HTMLInputElement, {
      target: { value: "https://example.com/job" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockResolve).toHaveBeenCalledWith({
        url: "https://example.com/job",
      });
    });
    expect(mockRemove).toHaveBeenCalled();
  });

  test("rejects on cancel without resolving", () => {
    render(<AddJobModal id="add-job-test" />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockReject).toHaveBeenCalled();
    expect(mockRemove).toHaveBeenCalled();
    expect(mockResolve).not.toHaveBeenCalled();
  });
});
