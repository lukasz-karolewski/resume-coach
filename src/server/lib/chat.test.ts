import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PrismaClient } from "~/generated/prisma/client";
import {
  createChatMessage,
  getChatThreadMessages,
  listChatThreads,
} from "./chat";

type MockDb = {
  chatMessage: {
    create: ReturnType<typeof vi.fn>;
  };
  chatThread: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
};

describe("chat lib", () => {
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = {
      chatMessage: {
        create: vi.fn(),
      },
      chatThread: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    };
  });

  test("lists chat threads with a summary from the first user message", async () => {
    mockDb.chatThread.findMany.mockResolvedValue([
      {
        createdAt: new Date("2026-03-23T00:00:00.000Z"),
        id: "thread-1",
        messages: [
          {
            content:
              "This is the first prompt sent to the assistant and it should be truncated if it is very long indeed.",
          },
        ],
      },
    ]);

    const result = await listChatThreads(
      mockDb as unknown as PrismaClient,
      "user-123",
    );

    expect(result).toEqual([
      {
        createdAt: new Date("2026-03-23T00:00:00.000Z"),
        id: "thread-1",
        summary:
          "This is the first prompt sent to the assistant and it should be truncated if it is very long indeed.",
      },
    ]);
    expect(mockDb.chatThread.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-123",
        },
      }),
    );
  });

  test("filters chat threads by resume when a resume id is provided", async () => {
    mockDb.chatThread.findMany.mockResolvedValue([]);

    await listChatThreads(mockDb as unknown as PrismaClient, "user-123", 7);

    expect(mockDb.chatThread.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          resumeId: 7,
          userId: "user-123",
        },
      }),
    );
  });

  test("retrieves messages for an owned conversation", async () => {
    mockDb.chatThread.findFirst.mockResolvedValue({
      createdAt: new Date("2026-03-23T00:00:00.000Z"),
      id: "thread-1",
      messages: [
        {
          content: "Hello",
          createdAt: new Date("2026-03-23T00:00:01.000Z"),
          id: "msg-1",
          role: "user",
        },
      ],
    });

    const result = await getChatThreadMessages(
      mockDb as unknown as PrismaClient,
      "user-123",
      "thread-1",
    );

    expect(result.messages).toEqual([
      {
        content: "Hello",
        createdAt: new Date("2026-03-23T00:00:01.000Z"),
        id: "msg-1",
        role: "user",
      },
    ]);
  });

  test("creates chat messages", async () => {
    await createChatMessage(mockDb as unknown as PrismaClient, {
      content: "Hello",
      role: "user",
      threadId: "thread-1",
    });

    expect(mockDb.chatMessage.create).toHaveBeenCalledWith({
      data: {
        content: "Hello",
        role: "user",
        threadId: "thread-1",
      },
    });
  });
});
