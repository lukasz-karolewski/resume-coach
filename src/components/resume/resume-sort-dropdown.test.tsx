import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { normalizeResumeSort } from "./resume-sort";
import ResumeSortDropdown from "./resume-sort-dropdown";

const mockPush = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/resume",
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockUseSearchParams(),
}));

describe("ResumeSortDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  test("defaults to last updated for invalid sort values", () => {
    expect(normalizeResumeSort()).toBe("last-updated");
    expect(normalizeResumeSort("unknown")).toBe("last-updated");
    expect(normalizeResumeSort("created")).toBe("created");
    expect(normalizeResumeSort("name")).toBe("name");
  });

  test("pushes the selected sort into search params", () => {
    render(<ResumeSortDropdown value="last-updated" />);

    fireEvent.pointerDown(
      screen.getByRole("button", { name: /sort by last updated/i }),
    );
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Name" }));

    expect(mockPush).toHaveBeenCalledWith("/resume?sort=name");
  });

  test("pushes the created sort into search params", () => {
    render(<ResumeSortDropdown value="created" />);

    fireEvent.pointerDown(
      screen.getByRole("button", { name: /sort by created/i }),
    );
    fireEvent.click(
      screen.getByRole("menuitemradio", { name: "Last updated" }),
    );

    expect(mockPush).toHaveBeenCalledWith("/resume?sort=last-updated");
  });
});
