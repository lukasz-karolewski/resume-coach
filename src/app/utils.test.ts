import { describe, expect, test } from "vitest";
import { formatFromTo, toYearMonthsDuration } from "./utils";

describe("toYearMonthsDuration", () => {
  test("should return correct duration in months when less than a year", () => {
    const from = new Date(2022, 0, 1); // January 1, 2022
    const to = new Date(2022, 5, 1); // June 1, 2022
    expect(toYearMonthsDuration(from, to)).toBe("5 m");
  });

  test("should return correct duration in years when exact years", () => {
    const from = new Date(2020, 0, 1); // January 1, 2020
    const to = new Date(2022, 0, 1); // January 1, 2022
    expect(toYearMonthsDuration(from, to)).toBe("2 y");
  });

  test("should return correct duration in years and months", () => {
    const from = new Date(2019, 0, 1); // January 1, 2019
    const to = new Date(2022, 5, 1); // June 1, 2022
    expect(toYearMonthsDuration(from, to)).toBe("3 y, 5 m");
  });

  test("should return correct duration from a past date to now", () => {
    const from = new Date(2020, 0, 1); // January 1, 2020
    const now = new Date();
    const expectedYears = now.getFullYear() - 2020;
    const expectedMonths = now.getMonth();
    const expectedDuration =
      expectedMonths === 0
        ? `${expectedYears} y`
        : `${expectedYears} y, ${expectedMonths} m`;
    expect(toYearMonthsDuration(from)).toBe(expectedDuration);
  });

  test("should handle same start and end date", () => {
    const date = new Date(2022, 0, 1); // January 1, 2022
    expect(toYearMonthsDuration(date, date)).toBe("0 m");
  });
});

describe("formatFromTo", () => {
  test("should format both from and to dates correctly", () => {
    const from = new Date(2020, 0, 1); // January 1, 2020
    const to = new Date(2022, 5, 1); // June 1, 2022
    const result = formatFromTo(from, to);
    expect(result).toEqual({
      formattedFrom: "Jan 2020",
      formattedTo: "Jun 2022",
    });
  });

  test("should format from date and set to date as 'Present' when to date is not provided", () => {
    const from = new Date(2020, 0, 1); // January 1, 2020
    const result = formatFromTo(from);
    expect(result).toEqual({
      formattedFrom: "Jan 2020",
      formattedTo: "Present",
    });
  });

  test("should handle same start and end date", () => {
    const date = new Date(2022, 0, 1); // January 1, 2022
    const result = formatFromTo(date, date);
    expect(result).toEqual({
      formattedFrom: "Jan 2022",
      formattedTo: "Jan 2022",
    });
  });

  test("should format dates correctly for different months and years", () => {
    const from = new Date(2019, 10, 15); // November 15, 2019
    const to = new Date(2021, 2, 10); // March 10, 2021
    const result = formatFromTo(from, to);
    expect(result).toEqual({
      formattedFrom: "Nov 2019",
      formattedTo: "Mar 2021",
    });
  });

  test("should format dates correctly for end of month dates", () => {
    const from = new Date(2018, 11, 31); // December 31, 2018
    const to = new Date(2020, 11, 31); // December 31, 2020
    const result = formatFromTo(from, to);
    expect(result).toEqual({
      formattedFrom: "Dec 2018",
      formattedTo: "Dec 2020",
    });
  });
});
