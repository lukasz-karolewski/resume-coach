import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  test("renders its child element when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/signup">Get started</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Get started" });

    expect(link).toHaveAttribute("href", "/signup");
    expect(link).toHaveAttribute("data-slot", "button");
  });
});
