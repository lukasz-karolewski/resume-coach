import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { createByteStream } from "./tests/byte-stream";
import { useChatStream } from "./use-chat-stream";

describe("useChatStream", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("opens a resume and keeps the assistant reply in the conversation", async () => {
    const onOpenResume = vi.fn();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        body: createByteStream([
          'event: navigate\ndata: {"resumeId":"Res042"}\n\n',
          'event: chunk\ndata: {"content":"Cloned it — want a punchier summary?"}\n\n',
          'event: done\ndata: {"threadId":"thread-123"}\n\n',
        ]),
        ok: true,
      })),
    );

    const { result } = renderHook(() => useChatStream({ onOpenResume }));

    await act(async () => {
      await result.current.sendMessage("clone my resume");
    });

    expect(onOpenResume).toHaveBeenCalledWith("Res042");
    expect(result.current.messages).toEqual([
      expect.objectContaining({ content: "clone my resume", role: "user" }),
      expect.objectContaining({
        content: "Cloned it — want a punchier summary?",
        role: "assistant",
      }),
    ]);
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

  test("clears stale messages immediately when switching threads", async () => {
    let resolveNextThread:
      | ((value: Response | PromiseLike<Response>) => void)
      | undefined;

    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        if (input === "/api/chat/threads/thread-123") {
          return Promise.resolve({
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
          } as Response);
        }

        if (input === "/api/chat/threads/thread-456") {
          return new Promise<Response>((resolve) => {
            resolveNextThread = resolve;
          });
        }

        throw new Error(`Unexpected fetch input: ${String(input)}`);
      }),
    );

    const { result, rerender } = renderHook(
      ({ threadId }: { threadId?: string }) =>
        useChatStream({
          threadId,
        }),
      {
        initialProps: {
          threadId: "thread-123",
        },
      },
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

    rerender({
      threadId: "thread-456",
    });

    expect(result.current.messages).toEqual([]);

    resolveNextThread?.({
      json: async () => ({
        messages: [
          {
            content: "Later message",
            createdAt: "2026-03-24T01:00:00.000Z",
            id: "msg-2",
            role: "assistant",
          },
        ],
      }),
      ok: true,
    } as Response);

    await waitFor(() => {
      expect(result.current.messages).toEqual([
        {
          content: "Later message",
          id: "msg-2",
          role: "assistant",
        },
      ]);
    });
  });
});
