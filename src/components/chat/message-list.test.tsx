import { render, screen, within } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { MessageList } from "./message-list";

describe("MessageList", () => {
  test("renders the conversation and streaming reply in a busy, scrollable log", () => {
    render(
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
    const log = screen.getByRole("log");
    expect(log).toHaveAttribute("aria-busy", "true");
    expect(within(log).getByText("Review my summary")).toBeInTheDocument();
    expect(within(log).getByText("A response in progress")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Scroll to end" }),
    ).toBeInTheDocument();
  });
});
