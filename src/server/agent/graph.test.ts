import { beforeEach, describe, expect, it, vi } from "vitest";

const { createRun } = vi.hoisted(() => ({
  createRun(
    textChunks = ["Hello", " world"],
    toolCalls: Array<Record<string, unknown>> = [],
  ) {
    return {
      messages: {
        async *[Symbol.asyncIterator]() {
          yield {
            text: {
              async *[Symbol.asyncIterator]() {
                yield* textChunks;
              },
            },
          };
        },
      },
      output: Promise.resolve({}),
      toolCalls: {
        async *[Symbol.asyncIterator]() {
          yield* toolCalls;
        },
      },
    };
  },
}));

// Mock dependencies before imports
vi.mock("../db", () => ({
  db: {
    chatMessage: {
      create: vi.fn(),
    },
    chatThread: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("langchain", () => ({
  createAgent: vi.fn(() => ({
    streamEvents: vi.fn(async () => createRun()),
  })),
  HumanMessage: class HumanMessage {
    constructor(public content: string) {}
  },
}));

vi.mock("@langchain/langgraph-checkpoint-redis", () => ({
  RedisSaver: {
    fromUrl: vi.fn(() => Promise.resolve({})),
  },
}));

vi.mock("./prompt", () => ({
  myDynamicSystemPromptMiddleware: { name: "mock-middleware" },
}));

vi.mock("./tools", () => ({
  allTools: [],
}));

import { db } from "../db";
import { executeChatStream } from "./graph";

describe("executeChatStream", () => {
  const mockSendEvent = vi.fn();
  const userId = "user-123";
  const message = "Hello, coach!";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a new thread when threadId is not provided", async () => {
    const mockThread = { id: "thread-123" };
    vi.mocked(db.chatThread.create).mockResolvedValue(mockThread as never);

    await executeChatStream({
      message,
      resumeId: undefined,
      sendEvent: mockSendEvent,
      threadId: undefined,
      userId,
    });

    expect(db.chatThread.create).toHaveBeenCalledWith({
      data: {
        resumeId: null,
        userId,
      },
    });
  });

  it("should use existing thread when threadId is provided", async () => {
    const mockThread = { id: "thread-456" };
    vi.mocked(db.chatThread.findFirst).mockResolvedValue(mockThread as never);

    await executeChatStream({
      message,
      resumeId: undefined,
      sendEvent: mockSendEvent,
      threadId: "thread-456",
      userId,
    });

    expect(db.chatThread.findFirst).toHaveBeenCalledWith({
      where: {
        id: "thread-456",
        userId,
      },
    });
    expect(db.chatThread.create).not.toHaveBeenCalled();
  });

  it("should send chunk events during streaming", async () => {
    const mockThread = { id: "thread-def" };
    vi.mocked(db.chatThread.create).mockResolvedValue(mockThread as never);

    await executeChatStream({
      message,
      resumeId: undefined,
      sendEvent: mockSendEvent,
      threadId: undefined,
      userId,
    });

    expect(mockSendEvent).toHaveBeenCalledWith("chunk", {
      content: "Hello",
    });
    expect(mockSendEvent).toHaveBeenCalledWith("chunk", {
      content: " world",
    });
  });

  it("should stream typed tool-call lifecycle events", async () => {
    const { createAgent } = await import("langchain");
    vi.mocked(createAgent).mockReturnValueOnce({
      streamEvents: vi.fn(async () =>
        createRun(
          [],
          [
            {
              callId: "call-1",
              error: Promise.resolve(undefined),
              input: { resumeId: "Res001" },
              name: "viewResume",
              output: Promise.resolve("ok"),
              status: Promise.resolve("finished"),
            },
          ],
        ),
      ),
    } as never);

    const mockThread = { id: "thread-blocks" };
    vi.mocked(db.chatThread.create).mockResolvedValue(mockThread as never);

    await executeChatStream({
      message,
      resumeId: undefined,
      sendEvent: mockSendEvent,
      threadId: undefined,
      userId,
    });

    expect(mockSendEvent).toHaveBeenCalledWith("tool_start", {
      input: { resumeId: "Res001" },
      runId: "call-1",
      tool: "viewResume",
    });
    expect(mockSendEvent).toHaveBeenCalledWith("tool_end", {
      error: undefined,
      output: "ok",
      runId: "call-1",
      status: "finished",
      tool: "viewResume",
    });
  });

  it("asks the UI to navigate when the agent opens a resume", async () => {
    const { createAgent } = await import("langchain");
    vi.mocked(createAgent).mockReturnValueOnce({
      streamEvents: vi.fn(async () =>
        createRun(
          ["Cloned it, here is what changed."],
          [
            {
              callId: "call-open",
              error: Promise.resolve(undefined),
              input: { resumeId: "Res042" },
              name: "openResume",
              output: Promise.resolve({ opened: true, resumeId: "Res042" }),
              status: Promise.resolve("finished"),
            },
          ],
        ),
      ),
    } as never);

    vi.mocked(db.chatThread.create).mockResolvedValue({
      id: "thread-open",
    } as never);

    await executeChatStream({
      message,
      resumeId: "Res001",
      sendEvent: mockSendEvent,
      threadId: undefined,
      userId,
    });

    expect(mockSendEvent).toHaveBeenCalledWith("navigate", {
      resumeId: "Res042",
    });
  });

  it("does not ask the UI to navigate when opening the resume failed", async () => {
    const { createAgent } = await import("langchain");
    vi.mocked(createAgent).mockReturnValueOnce({
      streamEvents: vi.fn(async () =>
        createRun(
          [],
          [
            {
              callId: "call-open",
              error: Promise.resolve(undefined),
              input: { resumeId: "Res042" },
              name: "openResume",
              output: Promise.resolve({ error: "Resume not found" }),
              status: Promise.resolve("finished"),
            },
          ],
        ),
      ),
    } as never);

    vi.mocked(db.chatThread.create).mockResolvedValue({
      id: "thread-open-failed",
    } as never);

    await executeChatStream({
      message,
      resumeId: "Res001",
      sendEvent: mockSendEvent,
      threadId: undefined,
      userId,
    });

    expect(mockSendEvent).not.toHaveBeenCalledWith(
      "navigate",
      expect.anything(),
    );
  });

  it("moves an existing thread onto the resume the user is now editing", async () => {
    vi.mocked(db.chatThread.findFirst).mockResolvedValue({
      id: "thread-roaming",
      resumeId: "Res001",
    } as never);

    await executeChatStream({
      message,
      resumeId: "Res042",
      sendEvent: mockSendEvent,
      threadId: "thread-roaming",
      userId,
    });

    expect(db.chatThread.update).toHaveBeenCalledWith({
      data: { resumeId: "Res042" },
      where: { id: "thread-roaming" },
    });
  });

  it("keeps the thread resume when the user leaves resume pages", async () => {
    vi.mocked(db.chatThread.findFirst).mockResolvedValue({
      id: "thread-roaming",
      resumeId: "Res001",
    } as never);

    await executeChatStream({
      message,
      resumeId: undefined,
      sendEvent: mockSendEvent,
      threadId: "thread-roaming",
      userId,
    });

    expect(db.chatThread.update).not.toHaveBeenCalled();
  });

  it("uses v3 projections and forwards the abort signal", async () => {
    const { createAgent } = await import("langchain");
    const streamEvents = vi.fn(async () => createRun([]));
    vi.mocked(createAgent).mockReturnValueOnce({ streamEvents } as never);
    const signal = new AbortController().signal;
    vi.mocked(db.chatThread.create).mockResolvedValue({
      id: "thread-signal",
    } as never);

    await executeChatStream({
      message,
      resumeId: undefined,
      sendEvent: mockSendEvent,
      signal,
      threadId: undefined,
      userId,
    });

    expect(streamEvents).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ signal, version: "v3" }),
    );
  });

  it("should send done event with threadId", async () => {
    const mockThread = { id: "thread-ghi" };
    vi.mocked(db.chatThread.create).mockResolvedValue(mockThread as never);

    await executeChatStream({
      message,
      resumeId: undefined,
      sendEvent: mockSendEvent,
      threadId: undefined,
      userId,
    });

    expect(mockSendEvent).toHaveBeenCalledWith("done", {
      threadId: "thread-ghi",
    });
  });

  it("should return threadId", async () => {
    const mockThread = { id: "thread-mno" };
    vi.mocked(db.chatThread.create).mockResolvedValue(mockThread as never);

    const result = await executeChatStream({
      message,
      resumeId: undefined,
      sendEvent: mockSendEvent,
      threadId: undefined,
      userId,
    });

    expect(result).toEqual({ threadId: "thread-mno" });
  });

  it("persists user and assistant chat messages", async () => {
    const mockThread = { id: "thread-msg" };
    vi.mocked(db.chatThread.create).mockResolvedValue(mockThread as never);

    await executeChatStream({
      message,
      resumeId: undefined,
      sendEvent: mockSendEvent,
      threadId: undefined,
      userId,
    });

    expect(db.chatMessage.create).toHaveBeenNthCalledWith(1, {
      data: {
        content: message,
        role: "user",
        threadId: "thread-msg",
      },
    });
    expect(db.chatMessage.create).toHaveBeenNthCalledWith(2, {
      data: {
        content: "Hello world",
        role: "assistant",
        threadId: "thread-msg",
      },
    });
  });

  it("should associate thread with resumeId when provided", async () => {
    const mockThread = { id: "thread-pqr" };
    vi.mocked(db.chatThread.create).mockResolvedValue(mockThread as never);

    await executeChatStream({
      message,
      resumeId: "Res042",
      sendEvent: mockSendEvent,
      threadId: undefined,
      userId,
    });

    expect(db.chatThread.create).toHaveBeenCalledWith({
      data: {
        resumeId: "Res042",
        userId,
      },
    });
  });
});
