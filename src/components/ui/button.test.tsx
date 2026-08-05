import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  test("renders its child element through the Base UI render prop", () => {
    render(<Button render={<a href="/signup" />}>Get started</Button>);

    const link = screen.getByRole("link", { name: "Get started" });

    expect(link).toHaveAttribute("href", "/signup");
    expect(link).toHaveAttribute("data-slot", "button");
  });
});
