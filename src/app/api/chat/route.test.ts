import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const { executeChatStream, getSession } = vi.hoisted(() => ({
  executeChatStream: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

vi.mock("~/auth", () => ({
  auth: {
    api: {
      getSession,
    },
  },
}));

vi.mock("~/server/agent/graph", () => ({
  executeChatStream,
}));

import { POST } from "./route";

function createRequest(body: unknown) {
  return new NextRequest("http://localhost/api/chat", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({ user: { id: "user-1" } });
  });

  test("returns an SSE response and passes a signal to the agent", async () => {
    executeChatStream.mockImplementation(
      async ({
        sendEvent,
      }: {
        sendEvent: (type: string, data: unknown) => Promise<void>;
      }) => {
        await sendEvent("chunk", { content: "Hello" });
      },
    );

    const response = await POST(
      createRequest({ message: "  Review my resume  ", resumeId: 7 }),
    );

    expect(response.headers.get("content-type")).toBe(
      "text/event-stream; charset=utf-8",
    );
    expect(await response.text()).toBe(
      'event: chunk\ndata: {"content":"Hello"}\n\n',
    );
    expect(executeChatStream).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Review my resume",
        resumeId: 7,
        signal: expect.any(AbortSignal),
        userId: "user-1",
      }),
    );
  });

  test("aborts the agent when the response stream is cancelled", async () => {
    let agentSignal: AbortSignal | undefined;
    executeChatStream.mockImplementation(
      ({ signal }: { signal: AbortSignal }) =>
        new Promise<void>((resolve) => {
          agentSignal = signal;
          signal.addEventListener("abort", () => resolve(), { once: true });
        }),
    );

    const response = await POST(createRequest({ message: "Review this" }));
    const reader = response.body?.getReader();
    await reader?.cancel();

    expect(agentSignal?.aborted).toBe(true);
  });
});
