import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import JobExperience from "./job-experience";

const position = {
  accomplishments: "- Reduced deployment time by 50%",
  endDate: null,
  experienceId: 12,
  id: 34,
  location: "Remote",
  skillPosition: [],
  startDate: new Date("2022-01-01T00:00:00.000Z"),
  title: "Staff Engineer",
};

const jobs = [
  {
    companyName: "Acme",
    id: 12,
    link: null,
    positions: [position],
    resumeId: 7,
  },
];

describe("JobExperience", () => {
  test("requests position-level editing when accomplishments are double-clicked", () => {
    const onEditAccomplishments = vi.fn();

    render(
      <JobExperience
        jobs={jobs}
        onEditAccomplishments={onEditAccomplishments}
      />,
    );

    fireEvent.doubleClick(screen.getByText("Reduced deployment time by 50%"));

    expect(onEditAccomplishments).toHaveBeenCalledWith(position);
  });

  test("provides an explicit keyboard-accessible edit control", () => {
    const onEditAccomplishments = vi.fn();

    render(
      <JobExperience
        jobs={jobs}
        onEditAccomplishments={onEditAccomplishments}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit accomplishments for Staff Engineer",
      }),
    );

    expect(onEditAccomplishments).toHaveBeenCalledWith(position);
  });
});
