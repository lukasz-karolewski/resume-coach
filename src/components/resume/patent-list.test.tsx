import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { PatentList } from "./patent-list";

describe("PatentList", () => {
  test("opens editing for a patent item", () => {
    const patent = {
      date: new Date("2021-06-01T00:00:00.000Z"),
      description: "Reduced stale reads in distributed systems.",
      id: 52,
      link: "https://patents.example.com/cache",
      resumeId: 7,
      title: "Adaptive cache invalidation",
    };
    const onEdit = vi.fn();

    render(<PatentList patents={[patent]} onEdit={onEdit} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Edit patent Adaptive cache invalidation",
      }),
    );
    expect(onEdit).toHaveBeenCalledWith(patent);
  });
});
