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
}));

vi.mock("@langchain/langgraph-checkpoint-redis", () => ({
  RedisSaver: {
    fromUrl: vi.fn(() => Promise.resolve({})),
  },
}));

vi.mock("./prompt", () => ({
  COACH_SYSTEM_PROMPT: "Mock prompt",
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

  it("should store user message in database", async () => {
    const mockThread = { id: "thread-789" };
    vi.mocked(db.chatThread.create).mockResolvedValue(mockThread as never);

    await executeChatStream({
      message,
      resumeId: undefined,
      sendEvent: mockSendEvent,
      threadId: undefined,
      userId,
    });

    expect(db.chatMessage.create).toHaveBeenCalledWith({
      data: {
        content: message,
        role: "user",
        threadId: "thread-789",
      },
    });
  });

  it("should send user message event", async () => {
    const mockThread = { id: "thread-abc" };
    vi.mocked(db.chatThread.create).mockResolvedValue(mockThread as never);

    await executeChatStream({
      message,
      resumeId: undefined,
      sendEvent: mockSendEvent,
      threadId: undefined,
      userId,
    });

    expect(mockSendEvent).toHaveBeenCalledWith("message", {
      content: message,
      role: "user",
    });
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

  it("should store assistant message after streaming completes", async () => {
    const mockThread = { id: "thread-jkl" };
    vi.mocked(db.chatThread.create).mockResolvedValue(mockThread as never);

    await executeChatStream({
      message,
      resumeId: undefined,
      sendEvent: mockSendEvent,
      threadId: undefined,
      userId,
    });

    expect(db.chatMessage.create).toHaveBeenCalledWith({
      data: {
        content: "Hello world",
        role: "assistant",
        threadId: "thread-jkl",
      },
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
});
