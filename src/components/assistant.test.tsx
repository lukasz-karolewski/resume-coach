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

  test("shows the conversation dropdown in the chat window", async () => {
    sessionStorage.setItem("chatThreadId", "thread-123");

    render(<Assistant />);

    fireEvent.click(screen.getByLabelText("Open chat"));

    expect(await screen.findByLabelText("Select conversation")).toBeInTheDocument();
  });
});
