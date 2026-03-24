import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ChatInput } from "./chat-input";

describe("ChatInput", () => {
  test("shows a stop button while loading and calls onStop", () => {
    const onStop = vi.fn();

    render(<ChatInput onSend={vi.fn()} onStop={onStop} disabled />);

    fireEvent.click(screen.getByText("Stop"));

    expect(onStop).toHaveBeenCalledTimes(1);
  });

  test("sends a message when not loading", () => {
    const onSend = vi.fn();

    render(<ChatInput onSend={onSend} disabled={false} />);

    fireEvent.change(
      screen.getByPlaceholderText(
        "Ask about your resume or paste a job URL...",
      ),
      {
        target: { value: "hello" },
      },
    );
    fireEvent.click(screen.getByText("Send"));

    expect(onSend).toHaveBeenCalledWith("hello");
  });

  test("grows the textarea for multi-line input", () => {
    render(<ChatInput onSend={vi.fn()} disabled={false} />);

    const textarea = screen.getByPlaceholderText(
      "Ask about your resume or paste a job URL...",
    ) as HTMLTextAreaElement;

    Object.defineProperty(textarea, "scrollHeight", {
      configurable: true,
      value: 160,
    });

    fireEvent.change(textarea, {
      target: { value: "line 1\nline 2\nline 3" },
    });

    expect(textarea.style.height).toBe("160px");
  });
});
