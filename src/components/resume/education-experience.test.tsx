import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import EducationExperience from "./education-experience";

describe("EducationExperience", () => {
  test("renders complete education details and exposes the item editor", () => {
    const education = {
      distinction: "MSc Computer Science",
      endDate: new Date("2022-06-01T00:00:00.000Z"),
      id: 31,
      institution: "Example University",
      link: "https://example.edu",
      location: "Seattle, WA",
      notes: "Distributed systems",
      resumeId: "Res007",
      startDate: new Date("2020-09-01T00:00:00.000Z"),
      type: "EDUCATION" as const,
    };
    const onEdit = vi.fn();

    render(<EducationExperience educationList={[education]} onEdit={onEdit} />);

    expect(screen.getByText("MSc Computer Science")).toBeInTheDocument();
    expect(screen.getByText("Seattle, WA")).toBeInTheDocument();
    expect(screen.getByText("Distributed systems")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Example University" }),
    ).toHaveAttribute("href", "https://example.edu");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit education at Example University",
      }),
    );
    expect(onEdit).toHaveBeenCalledWith(education);
  });

  test("deletes a certification from its own control", async () => {
    const certification = {
      distinction: "Professional Cloud Architect",
      endDate: new Date("2023-03-01T00:00:00.000Z"),
      id: 32,
      institution: "Google Cloud",
      link: "",
      location: "Online",
      notes: null,
      resumeId: "Res007",
      startDate: new Date("2023-03-01T00:00:00.000Z"),
      type: "CERTIFICATION" as const,
    };
    const onDelete = vi.fn();

    render(
      <EducationExperience
        educationList={[certification]}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete certification at Google Cloud",
      }),
    );
    fireEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Delete",
      }),
    );
    expect(onDelete).toHaveBeenCalledWith(certification);
  });
});
