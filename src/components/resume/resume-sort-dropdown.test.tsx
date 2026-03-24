import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  getResumeSort,
  sortResumes,
} from "./resume-sort";
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
    expect(getResumeSort()).toBe("last-updated");
    expect(getResumeSort("unknown")).toBe("last-updated");
    expect(getResumeSort("name")).toBe("name");
  });

  test("sorts resumes by last updated descending", () => {
    expect(
      sortResumes(
        [
          { name: "B", updatedAt: "2024-01-01T00:00:00.000Z" },
          { name: "A", updatedAt: "2024-02-01T00:00:00.000Z" },
        ],
        "last-updated",
      ).map((resume) => resume.name),
    ).toEqual(["A", "B"]);
  });

  test("sorts resumes by name ascending", () => {
    expect(
      sortResumes(
        [
          { name: "Zulu", updatedAt: "2024-01-01T00:00:00.000Z" },
          { name: "Alpha", updatedAt: "2024-02-01T00:00:00.000Z" },
        ],
        "name",
      ).map((resume) => resume.name),
    ).toEqual(["Alpha", "Zulu"]);
  });

  test("pushes the selected sort into search params", () => {
    render(<ResumeSortDropdown value="last-updated" />);

    fireEvent.pointerDown(
      screen.getByRole("button", { name: /sort by last updated/i }),
    );
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Name" }));

    expect(mockPush).toHaveBeenCalledWith("/resume?sort=name");
  });
});
