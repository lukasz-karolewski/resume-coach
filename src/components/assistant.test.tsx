import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Assistant from "./assistant";

const { navigationState, push, useChatStream } = vi.hoisted(() => ({
  navigationState: {
    pathname: "/resume/1",
  },
  push: vi.fn(),
  useChatStream: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => navigationState.pathname),
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
    navigationState.pathname = "/resume/1";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (input === "/api/chat/threads") {
          return {
            json: async () => ({
              threads: [
                {
                  createdAt: "2026-03-23T00:00:00.000Z",
                  id: "thread-123",
                  summary: "First conversation",
                },
                {
                  createdAt: "2026-03-24T00:00:00.000Z",
                  id: "thread-456",
                  summary: "Second conversation",
                },
              ],
            }),
            ok: true,
          } as Response;
        }

        return {
          json: async () => ({ messages: [] }),
          ok: true,
        } as Response;
      }),
    );

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

  test("navigates to a resume without discarding the conversation", () => {
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

    capturedOptions?.onOpenResume?.(42);

    expect(resetChat).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("chatThreadId")).toBe("thread-123");
    expect(push).toHaveBeenCalledWith("/resume/42");
    expect(useChatStream).toHaveBeenLastCalledWith(
      expect.objectContaining({ threadId: "thread-123" }),
    );
  });

  test("does not navigate when the resume is already open", () => {
    let capturedOptions: Parameters<typeof useChatStream>[0] | undefined;

    useChatStream.mockImplementation((options) => {
      capturedOptions = options;

      return {
        cancelRequest: vi.fn(),
        currentChunk: "",
        error: null,
        isLoading: false,
        messages: [],
        resetChat: vi.fn(),
        sendMessage: vi.fn(),
        toolExecutions: [],
      };
    });

    render(<Assistant />);

    capturedOptions?.onOpenResume?.(1);

    expect(push).not.toHaveBeenCalled();
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

    const launcher = screen.getByLabelText("Open chat");

    expect(launcher).toHaveClass("h-12", "w-12", "rounded-2xl");

    fireEvent.click(launcher);

    expect(screen.getByLabelText("Close chat")).toBeInTheDocument();
    expect(screen.getByTestId("assistant-panel")).toHaveClass(
      "h-[min(66vh,48rem)]",
      "w-[min(32rem,calc(100vw-2rem))]",
      "rounded-3xl",
    );
  });

  test("shows the conversation dropdown in the chat window", async () => {
    sessionStorage.setItem("chatThreadId", "thread-123");

    render(<Assistant />);

    fireEvent.click(screen.getByLabelText("Open chat"));

    expect(
      await screen.findByLabelText("Select conversation"),
    ).toBeInTheDocument();
  });

  test("loads every conversation and restores the active thread id", async () => {
    sessionStorage.setItem("chatThreadId", "thread-123");

    render(<Assistant />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/chat/threads");
      expect(useChatStream).toHaveBeenLastCalledWith(
        expect.objectContaining({
          resumeId: 1,
          threadId: "thread-123",
        }),
      );
    });
  });

  test("keeps the active thread when the resume route changes", async () => {
    sessionStorage.setItem("chatThreadId", "thread-123");

    const { rerender } = render(<Assistant />);

    await waitFor(() => {
      expect(useChatStream).toHaveBeenLastCalledWith(
        expect.objectContaining({
          resumeId: 1,
          threadId: "thread-123",
        }),
      );
    });

    navigationState.pathname = "/resume/2";
    rerender(<Assistant />);

    await waitFor(() => {
      expect(useChatStream).toHaveBeenLastCalledWith(
        expect.objectContaining({
          resumeId: 2,
          threadId: "thread-123",
        }),
      );
    });
  });
});
