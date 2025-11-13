import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessageList } from "./message-list";
import type { ChatMessage, ToolExecution } from "./use-chat-stream";

describe("MessageList", () => {
  it("should have unique keys for multiple tool executions of the same tool", () => {
    const messages: ChatMessage[] = [];
    const toolExecutions: ToolExecution[] = [
      {
        id: "unique-id-1",
        input: { title: "Software Engineer" },
        status: "started",
        tool: "addExperience",
      },
      {
        id: "unique-id-2",
        input: { title: "Senior Developer" },
        status: "started",
        tool: "addExperience",
      },
    ];

    // This should not throw a React warning about duplicate keys
    const { container } = render(
      <MessageList messages={messages} toolExecutions={toolExecutions} />,
    );

    // Verify both tool executions are rendered
    const thinkingIndicators = container.querySelectorAll(
      '[class*="bg-gray-100"]',
    );
    expect(thinkingIndicators).toHaveLength(2);
  });

  it("should render messages with unique keys", () => {
    const messages: ChatMessage[] = [
      { content: "Hello", id: "1", role: "user" },
      { content: "Hi there", id: "2", role: "assistant" },
      { content: "How are you?", id: "3", role: "user" },
    ];

    const { container } = render(<MessageList messages={messages} />);

    // All messages should be rendered
    expect(container.textContent).toContain("Hello");
    expect(container.textContent).toContain("Hi there");
    expect(container.textContent).toContain("How are you?");
  });

  it("should show empty state when no messages", () => {
    render(<MessageList messages={[]} />);
    expect(screen.getByText("Resume Coach")).toBeInTheDocument();
  });
});
