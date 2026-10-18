import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { InlineEdit } from "./inline-edit";

function renderEdit(value = "Mac") {
  const onSave = vi.fn();
  render(<InlineEdit label="Passkey name" onSave={onSave} value={value} />);
  fireEvent.click(screen.getByRole("button", { name: /rename/i }));
  return {
    input: screen.getByRole("textbox", { name: "Passkey name" }),
    onSave,
  };
}

describe("InlineEdit", () => {
  test("saves the trimmed value on submit", async () => {
    const { input, onSave } = renderEdit();

    fireEvent.change(input, { target: { value: "  Work laptop " } });
    fireEvent.submit(input);

    await waitFor(() => expect(onSave).toHaveBeenCalledWith("Work laptop"));
    expect(
      await screen.findByRole("button", { name: /rename/i }),
    ).toBeVisible();
  });

  test("saves with the Save button", async () => {
    const { input, onSave } = renderEdit();

    fireEvent.change(input, { target: { value: "Phone" } });
    // A tap on Save blurs the field without focusing the button on Safari.
    fireEvent.blur(input);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith("Phone"));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  test("reports when editing starts and stops", () => {
    const onEditingChange = vi.fn();
    render(
      <InlineEdit
        label="Passkey name"
        onEditingChange={onEditingChange}
        onSave={vi.fn()}
        value="Mac"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /rename/i }));
    expect(onEditingChange).toHaveBeenLastCalledWith(true);

    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(onEditingChange).toHaveBeenLastCalledWith(false);
  });

  test("saves when focus leaves the field", async () => {
    const { input, onSave } = renderEdit();

    fireEvent.change(input, { target: { value: "Phone" } });
    fireEvent.blur(input);

    await waitFor(() => expect(onSave).toHaveBeenCalledWith("Phone"));
  });

  test("discards the edit on Escape", () => {
    const { input, onSave } = renderEdit();

    fireEvent.change(input, { target: { value: "Phone" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /rename mac/i })).toBeVisible();
  });

  test("does not save an empty or unchanged value", () => {
    const { input, onSave } = renderEdit();

    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.blur(input);
    fireEvent.click(screen.getByRole("button", { name: /rename/i }));
    fireEvent.blur(screen.getByRole("textbox", { name: "Passkey name" }));

    expect(onSave).not.toHaveBeenCalled();
  });

  test("shows the placeholder when there is no value", () => {
    render(
      <InlineEdit
        label="Passkey name"
        onSave={vi.fn()}
        placeholder="Passkey"
        value=""
      />,
    );

    expect(
      screen.getByRole("button", { name: "Rename Passkey" }),
    ).toBeVisible();
  });
});
