import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ResumeSectionItemDialog } from "./resume-section-item-dialog";

describe("ResumeSectionItemDialog", () => {
  test("prefills patent details and keeps deletion inside the edit modal", () => {
    const onDelete = vi.fn();
    const onSave = vi.fn();

    render(
      <ResumeSectionItemDialog
        initialItem={{
          date: "2021-06",
          description: "Original description",
          link: "https://patents.example.com/cache",
          title: "Adaptive cache invalidation",
          type: "PATENTS",
        }}
        isPending={false}
        open
        type="PATENTS"
        onDelete={onDelete}
        onOpenChange={vi.fn()}
        onSave={onSave}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Edit patent" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Patent title")).toHaveValue(
      "Adaptive cache invalidation",
    );
    expect(screen.getByLabelText("Date")).toHaveValue("2021-06");
    expect(screen.getByLabelText("Description")).toHaveValue(
      "Original description",
    );

    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "Updated description" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(onSave).toHaveBeenCalledWith({
      date: "2021-06",
      description: "Updated description",
      link: "https://patents.example.com/cache",
      title: "Adaptive cache invalidation",
      type: "PATENTS",
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete patent" }));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
