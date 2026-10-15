import { beforeEach, describe, expect, test, vi } from "vitest";

const checkpointerSetup = vi.fn(() => Promise.resolve());
const checkpointerEnd = vi.fn(() => Promise.resolve());
const postgresFromConnString = vi.fn(() => ({
  end: checkpointerEnd,
  setup: checkpointerSetup,
}));
const streamEvents = vi.fn(async () => ({
  messages: {
    async *[Symbol.asyncIterator]() {},
  },
  output: Promise.resolve({}),
  toolCalls: {
    async *[Symbol.asyncIterator]() {},
  },
}));
const createAgent = vi.fn(() => ({ streamEvents }));
const chatOpenAIConstructor = vi.fn();

vi.mock("../db", () => ({
  databaseUrl: "postgresql://test/resume_coach",
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

vi.mock("@langchain/langgraph-checkpoint-postgres", () => ({
  PostgresSaver: {
    fromConnString: postgresFromConnString,
  },
}));

vi.mock("@langchain/openai", () => ({
  ChatOpenAI: class ChatOpenAI {
    constructor(config: unknown) {
      chatOpenAIConstructor(config);
    }
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

describe("graph checkpointer initialization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  test("does not connect to Postgres when the module is imported", async () => {
    await import("./graph");

    expect(postgresFromConnString).not.toHaveBeenCalled();
  });

  test("configures GPT-5.4 to use the responses API", async () => {
    await import("./graph");

    expect(chatOpenAIConstructor).toHaveBeenCalledWith({
      model: "gpt-5.4",
      outputVersion: "v1",
      useResponsesApi: true,
    });
  });

  test("sets up the Postgres checkpointer when chat execution starts", async () => {
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

    expect(postgresFromConnString).toHaveBeenCalledWith(
      "postgresql://test/resume_coach",
      { schema: "langgraph" },
    );
    expect(checkpointerSetup).toHaveBeenCalledTimes(1);
    expect(createAgent).toHaveBeenCalledWith(
      expect.objectContaining({
        checkpointer: expect.objectContaining({ setup: checkpointerSetup }),
      }),
    );
  });

  test("retries checkpointer setup after a transient failure", async () => {
    const [{ db }, { executeChatStream }] = await Promise.all([
      import("../db"),
      import("./graph"),
    ]);

    vi.mocked(db.chatThread.create).mockResolvedValue({
      id: "thread-123",
    } as never);

    checkpointerSetup.mockRejectedValueOnce(new Error("Postgres unavailable"));

    await expect(
      executeChatStream({
        message: "Hello",
        resumeId: undefined,
        sendEvent: vi.fn().mockResolvedValue(undefined),
        threadId: undefined,
        userId: "user-123",
      }),
    ).rejects.toThrow("Postgres unavailable");

    await expect(
      executeChatStream({
        message: "Hello again",
        resumeId: undefined,
        sendEvent: vi.fn().mockResolvedValue(undefined),
        threadId: undefined,
        userId: "user-123",
      }),
    ).resolves.toEqual({ threadId: "thread-123" });

    expect(checkpointerEnd).toHaveBeenCalledTimes(1);
    expect(postgresFromConnString).toHaveBeenCalledTimes(2);
    expect(checkpointerSetup).toHaveBeenCalledTimes(2);
  });
});
