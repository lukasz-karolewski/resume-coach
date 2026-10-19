import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Skill } from "./skill";

describe("Skill", () => {
  test("edits and deletes an editable skill from its chip", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <Skill onDelete={onDelete} onEdit={onEdit}>
        TypeScript
      </Skill>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Edit skill TypeScript" }),
    );
    expect(onEdit).toHaveBeenCalledOnce();

    fireEvent.click(
      screen.getByRole("button", { name: "Delete skill TypeScript" }),
    );
    fireEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", {
        name: "Delete",
      }),
    );
    expect(onDelete).toHaveBeenCalledOnce();
  });

  test("offers no controls for a skill derived from a position", () => {
    render(<Skill>Kubernetes</Skill>);

    expect(screen.getByText("Kubernetes")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
