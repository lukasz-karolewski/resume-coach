import { describe, expect, test, vi } from "vitest";
import {
  formatRelativeTime,
  formatTimestampTooltip,
  toDateTimeValue,
} from "./date-time";

describe("date-time", () => {
  test("formats relative dates against the current time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));

    expect(formatRelativeTime(new Date("2026-03-24T10:30:00.000Z"))).toBe(
      "2 hours ago",
    );

    vi.useRealTimers();
  });

  test("formats tooltip timestamps with date and minutes in local time", () => {
    const value = new Date("2026-03-24T10:30:00.000Z");

    expect(formatTimestampTooltip(value)).toBe(
      new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(value),
    );
  });

  test("formats ISO dateTime values for time elements", () => {
    expect(toDateTimeValue(new Date("2026-03-24T10:30:00.000Z"))).toBe(
      "2026-03-24T10:30:00.000Z",
    );
  });
});
