import { beforeEach, describe, expect, test, vi } from "vitest";

const redisFromUrl = vi.fn(() => Promise.resolve({}));
const streamEvents = vi.fn(async function* () {});
const createAgent = vi.fn(() => ({ streamEvents }));

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

vi.mock("@langchain/langgraph-checkpoint-redis", () => ({
  RedisSaver: {
    fromUrl: redisFromUrl,
  },
}));

vi.mock("@langchain/openai", () => ({
  ChatOpenAI: class ChatOpenAI {
    constructor(_config: unknown) {}
  },
}));

vi.mock("langchain", () => ({
  createAgent,
  HumanMessage: class HumanMessage {
    constructor(public content: string) {}
  },
}));

vi.mock("./prompt", () => ({
  myDynamicSystemPromptMiddleware: { name: "mock-middleware" },
}));

vi.mock("./tools", () => ({
  allTools: [],
}));

describe("graph Redis initialization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  test("does not connect to Redis when the module is imported", async () => {
    await import("./graph");

    expect(redisFromUrl).not.toHaveBeenCalled();
  });

  test("connects to Redis when chat execution starts", async () => {
    const [{ db }, { executeChatStream }] = await Promise.all([
      import("../db"),
      import("./graph"),
    ]);

    vi.mocked(db.chatThread.create).mockResolvedValue({
      id: "thread-123",
    } as never);

    await executeChatStream({
      message: "Hello",
      resumeId: undefined,
      sendEvent: vi.fn().mockResolvedValue(undefined),
      threadId: undefined,
      userId: "user-123",
    });

    expect(redisFromUrl).toHaveBeenCalledTimes(1);
    expect(createAgent).toHaveBeenCalledTimes(1);
  });
});
