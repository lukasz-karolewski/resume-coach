import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies before imports
vi.mock("../db", () => ({
  db: {
    chatMessage: {
      create: vi.fn(),
    },
    chatThread: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

vi.mock("langchain", () => ({
  createAgent: vi.fn(() => ({
    streamEvents: vi.fn(async function* () {
      // Simulate streaming response
      yield {
        data: { chunk: { content: "Hello" } },
        event: "on_chat_model_stream",
      };
      yield {
        data: { chunk: { content: " world" } },
        event: "on_chat_model_stream",
      };
    }),
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

  it("should flatten text content blocks before sending chunk events", async () => {
    const { createAgent } = await import("langchain");
    vi.mocked(createAgent).mockReturnValueOnce({
      streamEvents: vi.fn(async function* () {
        yield {
          data: {
            chunk: {
              content: [
                { text: "hi", type: "text" },
                { text: " there", type: "output_text" },
                { args: { resumeId: 1 }, type: "tool_call" },
              ],
            },
          },
          event: "on_chat_model_stream",
        };
      }),
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

    expect(mockSendEvent).toHaveBeenCalledWith("chunk", {
      content: "hi there",
    });
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

  it("should associate thread with resumeId when provided", async () => {
    const mockThread = { id: "thread-pqr" };
    vi.mocked(db.chatThread.create).mockResolvedValue(mockThread as never);

    await executeChatStream({
      message,
      resumeId: 42,
      sendEvent: mockSendEvent,
      threadId: undefined,
      userId,
    });

    expect(db.chatThread.create).toHaveBeenCalledWith({
      data: {
        resumeId: 42,
        userId,
      },
    });
  });

  it("does not persist template resume ids on the chat thread", async () => {
    const mockThread = { id: "thread-template" };
    vi.mocked(db.chatThread.create).mockResolvedValue(mockThread as never);

    await executeChatStream({
      message,
      resumeId: -1,
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

  it("does not persist chat messages directly in the graph", async () => {
    const mockThread = { id: "thread-stu" };
    vi.mocked(db.chatThread.create).mockResolvedValue(mockThread as never);

    await executeChatStream({
      message,
      resumeId: undefined,
      sendEvent: mockSendEvent,
      threadId: undefined,
      userId,
    });

    expect(db.chatMessage.create).not.toHaveBeenCalled();
  });
});
