import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { Logo } from "./logo";

describe("Logo", () => {
  test("links home with the app icon and product name", () => {
    render(<Logo />);

    const link = screen.getByRole("link", { name: "Resume Coach" });
    expect(link).toHaveAttribute("href", "/");
    expect(link.querySelector("img")?.getAttribute("src")).toContain(
      "icon.svg",
    );
  });

  test("keeps the name for screen readers but hides it on phones by default", () => {
    render(<Logo />);

    expect(screen.getByText("Resume Coach")).toHaveClass(
      "sr-only",
      "sm:not-sr-only",
    );
  });

  test("can always show the name", () => {
    render(<Logo nameVisibility="always" />);

    expect(screen.getByText("Resume Coach")).not.toHaveClass("sr-only");
  });
});
