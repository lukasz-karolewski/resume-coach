import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import { Toaster, toast } from "./toast";

describe("Toaster", () => {
  afterEach(() => {
    act(() => toast.close());
  });

  test("renders a toast added through the shared Base UI manager", async () => {
    render(<Toaster />);

    act(() => {
      toast.add({ title: "Profile saved", type: "success" });
    });

    expect(await screen.findByText("Profile saved")).toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: "Profile saved" }),
    ).toHaveAttribute("data-type", "success");
  });
});
