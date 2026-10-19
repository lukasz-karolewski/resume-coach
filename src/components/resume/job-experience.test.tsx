import { fireEvent, render, screen, within } from "@testing-library/react";
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
    resumeId: "Res007",
  },
];

describe("JobExperience", () => {
  test("provides an explicit control for editing the complete experience item", () => {
    const onEditPosition = vi.fn();

    render(<JobExperience jobs={jobs} onEditPosition={onEditPosition} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit experience Staff Engineer at Acme",
      }),
    );

    expect(onEditPosition).toHaveBeenCalledWith(position, "Acme");
  });

  test("deletes a single position from its own control", async () => {
    const onDeletePosition = vi.fn();

    render(<JobExperience jobs={jobs} onDeletePosition={onDeletePosition} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete experience Staff Engineer at Acme",
      }),
    );
    fireEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Delete",
      }),
    );

    expect(onDeletePosition).toHaveBeenCalledWith(position);
  });
});
