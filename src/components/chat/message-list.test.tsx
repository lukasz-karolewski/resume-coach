import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { MessageList } from "./message-list";

describe("MessageList", () => {
  test("composes the shadcn message scroller with accessible streaming state", () => {
    const { container } = render(
      <MessageList
        currentChunk="A response in progress"
        isStreaming
        messages={[
          { content: "Review my summary", id: "user-1", role: "user" },
        ]}
      />,
    );

    expect(
      screen.getByRole("region", { name: "Messages" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("log")).toHaveAttribute("aria-busy", "true");
    expect(
      container.querySelector('[data-slot="message-scroller-item"]'),
    ).toHaveAttribute("data-scroll-anchor");
    expect(
      screen.getByRole("button", { name: "Scroll to end" }),
    ).toBeInTheDocument();
  });
});
