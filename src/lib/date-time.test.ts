import { describe, expect, test, vi } from "vitest";
import {
  formatMonthInput,
  formatRelativeTime,
  formatTimestampTooltip,
  toDateTimeValue,
} from "./date-time";

describe("date-time", () => {
  test("formats dates for month inputs", () => {
    expect(formatMonthInput(new Date("2026-08-04T12:00:00.000Z"))).toBe(
      "2026-08",
    );
    expect(formatMonthInput(null)).toBe("");
  });

  test("formats relative dates against the current time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));

    expect(formatRelativeTime(new Date("2026-03-24T10:30:00.000Z"))).toBe(
      "2 hours ago",
    );

    vi.useRealTimers();
  });

  test("formats tooltip timestamps with date and minutes in local time", () => {
    const originalTimeZone = process.env.TZ;
    process.env.TZ = "America/New_York";

    try {
      const tooltip = formatTimestampTooltip(
        new Date("2026-03-24T14:30:00.000Z"),
      );

      expect(tooltip).toContain("24");
      expect(tooltip).toContain("2026");
      expect(tooltip).toContain("10:30");
    } finally {
      if (originalTimeZone === undefined) delete process.env.TZ;
      else process.env.TZ = originalTimeZone;
    }
  });

  test("formats ISO dateTime values for time elements", () => {
    expect(toDateTimeValue(new Date("2026-03-24T10:30:00.000Z"))).toBe(
      "2026-03-24T10:30:00.000Z",
    );
  });
});
