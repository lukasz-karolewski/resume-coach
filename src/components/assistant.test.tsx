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
        if (input === "/api/chat/threads?resumeId=1") {
          return {
            json: async () => ({
              threads: [
                {
                  createdAt: "2026-03-23T00:00:00.000Z",
                  id: "thread-123",
                  resumeId: 1,
                  summary: "First conversation",
                },
              ],
            }),
            ok: true,
          } as Response;
        }

        if (input === "/api/chat/threads?resumeId=2") {
          return {
            json: async () => ({
              threads: [
                {
                  createdAt: "2026-03-24T00:00:00.000Z",
                  id: "thread-456",
                  resumeId: 2,
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

    sessionStorage.setItem("chatThreadId:resume:1", "thread-123");

    render(<Assistant />);

    capturedOptions?.onViewResume?.(42);

    expect(resetChat).toHaveBeenCalled();
    expect(sessionStorage.getItem("chatThreadId:resume:1")).toBe("thread-123");
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
    sessionStorage.setItem("chatThreadId:resume:1", "thread-123");

    render(<Assistant />);

    fireEvent.click(screen.getByLabelText("Open chat"));

    expect(
      await screen.findByLabelText("Select conversation"),
    ).toBeInTheDocument();
  });

  test("loads resume-scoped conversations and restores the scoped thread id", async () => {
    sessionStorage.setItem("chatThreadId:resume:1", "thread-123");

    render(<Assistant />);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/chat/threads?resumeId=1");
      expect(useChatStream).toHaveBeenLastCalledWith(
        expect.objectContaining({
          resumeId: 1,
          threadId: "thread-123",
        }),
      );
    });
  });

  test("switches to the correct stored thread when the resume route changes", async () => {
    sessionStorage.setItem("chatThreadId:resume:1", "thread-123");
    sessionStorage.setItem("chatThreadId:resume:2", "thread-456");

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
      expect(fetch).toHaveBeenCalledWith("/api/chat/threads?resumeId=2");
      expect(useChatStream).toHaveBeenLastCalledWith(
        expect.objectContaining({
          resumeId: 2,
          threadId: "thread-456",
        }),
      );
    });
  });
});
