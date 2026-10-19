import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ResumeAddItemButton, ResumeItemActions } from "./resume-item-controls";

describe("ResumeItemActions", () => {
  test("edits the item from its own control", () => {
    const onEdit = vi.fn();

    render(<ResumeItemActions label="patent Cache" onEdit={onEdit} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit patent Cache" }));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  test("deletes the item only after confirmation", async () => {
    const onDelete = vi.fn();

    render(<ResumeItemActions label="patent Cache" onDelete={onDelete} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Delete patent Cache" }),
    );
    const dialog = await screen.findByRole("alertdialog");
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  test("keeps the item when the confirmation is cancelled", async () => {
    const onDelete = vi.fn();

    render(<ResumeItemActions label="patent Cache" onDelete={onDelete} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Delete patent Cache" }),
    );
    fireEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Cancel",
      }),
    );
    expect(onDelete).not.toHaveBeenCalled();
  });

  test("renders nothing for a read-only item", () => {
    const { container } = render(<ResumeItemActions label="patent Cache" />);

    expect(container).toBeEmptyDOMElement();
  });
});

describe("ResumeAddItemButton", () => {
  test("starts adding an item of the section's kind", () => {
    const onClick = vi.fn();

    render(<ResumeAddItemButton itemLabel="patent" onClick={onClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Add patent" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
