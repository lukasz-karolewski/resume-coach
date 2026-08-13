import { fireEvent, render, screen } from "@testing-library/react";
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
});
