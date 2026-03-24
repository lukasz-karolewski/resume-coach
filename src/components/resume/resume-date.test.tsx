import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import ResumeDate from "./resume-date";

describe("ResumeDate", () => {
  test("renders relative text and exact timestamp metadata", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));

    render(
      <ResumeDate
        label="Updated"
        value={new Date("2026-03-24T10:30:00.000Z")}
      />,
    );

    expect(screen.getByText("Updated 2 hours ago")).toBeInTheDocument();
    expect(screen.getByText("Updated 2 hours ago")).toHaveAttribute(
      "dateTime",
      "2026-03-24T10:30:00.000Z",
    );

    vi.useRealTimers();
  });
});
