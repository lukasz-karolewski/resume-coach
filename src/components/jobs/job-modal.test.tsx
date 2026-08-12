import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { JobModal } from "./job-modal";

const mockHide = vi.fn();
const mockRemove = vi.fn();
const mockReject = vi.fn();
const mockResolve = vi.fn();

vi.mock("@ebay/nice-modal-react", () => ({
  default: {
    create: (component: React.ComponentType) => component,
  },
  useModal: () => ({
    hide: mockHide,
    reject: mockReject,
    remove: mockRemove,
    resolve: mockResolve,
    visible: true,
  }),
}));

vi.mock("~/components/ui/dialog", () => ({
  Dialog: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div role="dialog">{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

describe("JobModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("resolves complete application details", async () => {
    render(<JobModal id="job-modal-test" resumes={[]} />);

    fireEvent.change(document.getElementById("job-company")!, {
      target: { value: "Acme" },
    });
    fireEvent.change(document.getElementById("job-title")!, {
      target: { value: "Staff Engineer" },
    });
    fireEvent.change(document.getElementById("job-url")!, {
      target: { value: "https://example.com/job" },
    });
    fireEvent.change(document.getElementById("job-location")!, {
      target: { value: "Remote" },
    });
    fireEvent.change(document.getElementById("job-notes")!, {
      target: { value: "Follow up Friday" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add application" }));

    await waitFor(() => {
      expect(mockResolve).toHaveBeenCalledWith(
        expect.objectContaining({
          company: "Acme",
          location: "Remote",
          notes: "Follow up Friday",
          status: "SAVED",
          title: "Staff Engineer",
          url: "https://example.com/job",
        }),
      );
    });
    expect(mockHide).toHaveBeenCalled();
  });

  test("keeps invalid application details in the dialog", async () => {
    render(<JobModal id="job-modal-test" resumes={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "Add application" }));

    expect(await screen.findAllByRole("alert")).toHaveLength(3);
    expect(mockResolve).not.toHaveBeenCalled();
  });
});
