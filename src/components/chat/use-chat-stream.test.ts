import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { parseViewResumeCommand, useChatStream } from "./use-chat-stream";

describe("parseViewResumeCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns the resume id for a valid navigation command", () => {
    expect(parseViewResumeCommand("view resume 42")).toBe(42);
  });

  test("rejects assistant prose around the command", () => {
    expect(parseViewResumeCommand("Here you go: view resume 42")).toBeNull();
    expect(parseViewResumeCommand("view resume 42\nDone")).toBeNull();
    expect(parseViewResumeCommand("view resume -1")).toBeNull();
  });

  test("loads stored messages when a thread id is provided", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        json: async () => ({
          messages: [
            {
              content: "Earlier message",
              createdAt: "2026-03-24T00:00:00.000Z",
              id: "msg-1",
              role: "assistant",
            },
          ],
        }),
        ok: true,
      })),
    );

    const { result } = renderHook(() =>
      useChatStream({
        threadId: "thread-123",
      }),
    );

    await waitFor(() => {
      expect(result.current.messages).toEqual([
        {
          content: "Earlier message",
          id: "msg-1",
          role: "assistant",
        },
      ]);
    });
  });
});
