import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Assistant from "./assistant";

const { push, useChatStream } = vi.hoisted(() => ({
  push: vi.fn(),
  useChatStream: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/resume/1"),
  useRouter: vi.fn(() => ({
    push,
  })),
}));

vi.mock("./chat/use-chat-stream", () => ({
  useChatStream,
}));

describe("Assistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    useChatStream.mockReturnValue({
      cancelRequest: vi.fn(),
      currentChunk: "",
      error: null,
      isLoading: false,
      messages: [],
      resetChat: vi.fn(),
      sendMessage: vi.fn(),
      toolExecutions: [],
    });
  });

  test("navigates to a resume when the chat stream requests it", () => {
    const resetChat = vi.fn();
    let capturedOptions: Parameters<typeof useChatStream>[0] | undefined;

    useChatStream.mockImplementation((options) => {
      capturedOptions = options;

      return {
        cancelRequest: vi.fn(),
        currentChunk: "",
        error: null,
        isLoading: false,
        messages: [],
        resetChat,
        sendMessage: vi.fn(),
        toolExecutions: [],
      };
    });

    sessionStorage.setItem("chatThreadId", "thread-123");

    render(<Assistant />);

    capturedOptions?.onViewResume?.(42);

    expect(resetChat).toHaveBeenCalled();
    expect(sessionStorage.getItem("chatThreadId")).toBeNull();
    expect(push).toHaveBeenCalledWith("/resume/42");
  });

  test("passes the current resume id from the pathname into chat state", () => {
    render(<Assistant />);

    expect(useChatStream).toHaveBeenCalledWith(
      expect.objectContaining({
        resumeId: 1,
      }),
    );
  });

  test("wires chat cancellation through to the stop button", () => {
    const cancelRequest = vi.fn();

    useChatStream.mockReturnValue({
      cancelRequest,
      currentChunk: "",
      error: null,
      isLoading: true,
      messages: [],
      resetChat: vi.fn(),
      sendMessage: vi.fn(),
      toolExecutions: [],
    });

    render(<Assistant />);

    fireEvent.click(screen.getByLabelText("Open chat"));
    fireEvent.click(screen.getByText("Stop"));

    expect(cancelRequest).toHaveBeenCalledTimes(1);
  });

  test("opens the chat window from the launcher button", () => {
    render(<Assistant />);

    fireEvent.click(screen.getByLabelText("Open chat"));

    expect(screen.getByLabelText("Close chat")).toBeInTheDocument();
  });

  test("shows the current session id in the chat window", () => {
    sessionStorage.setItem("chatThreadId", "thread-123");

    render(<Assistant />);

    fireEvent.click(screen.getByLabelText("Open chat"));

    expect(screen.getByText("thread-123")).toBeInTheDocument();
  });
});
