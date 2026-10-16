import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { RelativeTime } from "./relative-time";

test("renders a relative time with the exact timestamp as machine-readable value", () => {
  const value = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

  render(<RelativeTime value={value} />);

  const time = screen.getByText(/ago$/);
  expect(time.tagName).toBe("TIME");
  expect(time.getAttribute("datetime")).toBe(value.toISOString());
  expect(time.getAttribute("title")).toBeTruthy();
});
