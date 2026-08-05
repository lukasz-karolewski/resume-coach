import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { ProfessionalSummary } from "./professional-summary";

describe("ProfessionalSummary", () => {
  test("requests editing when the summary is double-clicked", () => {
    const onEdit = vi.fn();

    render(
      <ProfessionalSummary
        info="Platform engineer focused on reliable delivery."
        onEdit={onEdit}
      />,
    );

    fireEvent.doubleClick(
      screen.getByText("Platform engineer focused on reliable delivery."),
    );

    expect(onEdit).toHaveBeenCalledOnce();
  });

  test("provides an explicit keyboard-accessible edit control", () => {
    const onEdit = vi.fn();

    render(<ProfessionalSummary info="Summary" onEdit={onEdit} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Edit professional summary" }),
    );

    expect(onEdit).toHaveBeenCalledOnce();
  });
});
