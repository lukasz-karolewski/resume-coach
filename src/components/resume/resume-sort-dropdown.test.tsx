import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
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

  test("pushes the selected sort into search params", () => {
    render(<ResumeSortDropdown value="last-updated" />);

    fireEvent.click(
      screen.getByRole("button", { name: /sort by last updated/i }),
    );
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Name" }));

    expect(mockPush).toHaveBeenCalledWith("/resume?sort=name");
  });
});
