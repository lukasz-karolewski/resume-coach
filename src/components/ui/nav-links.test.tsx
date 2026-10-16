import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { BottomNav, NavLinks } from "./nav-links";

const { usePathname } = vi.hoisted(() => ({ usePathname: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname }));

describe("app navigation", () => {
  beforeEach(() => {
    usePathname.mockReturnValue("/resume/abc123");
  });

  test.each([
    ["header", NavLinks],
    ["bottom bar", BottomNav],
  ])("%s links every section and marks the current one", (_, Nav) => {
    render(<Nav />);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/jobs",
      "/resume",
      "/profile",
    ]);
    expect(
      links.filter((link) => link.getAttribute("aria-current") === "page"),
    ).toEqual([screen.getByRole("link", { name: "Resumes" })]);
  });

  test("does not treat a shared prefix as the current section", () => {
    usePathname.mockReturnValue("/jobsearch");
    render(<NavLinks />);

    expect(screen.getByRole("link", { name: "Jobs" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  test("bottom bar is a phone-only landmark that reserves page clearance", () => {
    render(<BottomNav />);

    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav).toHaveAttribute("data-bottom-nav");
    expect(nav).toHaveClass("sm:hidden");
  });
});
