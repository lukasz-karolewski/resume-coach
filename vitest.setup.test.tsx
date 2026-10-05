import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

test("provides DOM matchers and browser APIs for component tests", () => {
  render(<button type="button">Save</button>);

  expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  expect(() =>
    new ResizeObserver(() => {}).observe(document.body),
  ).not.toThrow();
  expect(() =>
    new IntersectionObserver(() => {}).observe(document.body),
  ).not.toThrow();
  expect(CSS.supports("display", "grid")).toBe(true);
});

test("cleans up rendered components between tests", () => {
  expect(
    screen.queryByRole("button", { name: "Save" }),
  ).not.toBeInTheDocument();
});

test("keeps server environment access mocked while rendering server components", async () => {
  const { env } = await import("~/env");
  expect(env.NODE_ENV).toBe("test");
  expect(env.DATABASE_URL === "file:./test.db").toBe(true);
});
