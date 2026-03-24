import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PrismaClient } from "~/generated/prisma/client";
import {
  createChatMessage,
  getChatThreadMessages,
  listChatThreads,
} from "./chat";

describe("chat lib", () => {
  let mockDb: Partial<PrismaClient>;

  beforeEach(() => {
    mockDb = {
      chatMessage: {
        create: vi.fn(),
      } as any,
      chatThread: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      } as any,
    };
  });

  test("lists chat threads with a summary from the first user message", async () => {
    (mockDb.chatThread!.findMany as any).mockResolvedValue([
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

    const result = await listChatThreads(mockDb as PrismaClient, "user-123");

    expect(result).toEqual([
      {
        createdAt: new Date("2026-03-23T00:00:00.000Z"),
        id: "thread-1",
        summary:
          "This is the first prompt sent to the assistant and it should be truncated if it is very long indeed.",
      },
    ]);
  });

  test("retrieves messages for an owned conversation", async () => {
    (mockDb.chatThread!.findFirst as any).mockResolvedValue({
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
      mockDb as PrismaClient,
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
    await createChatMessage(mockDb as PrismaClient, {
      content: "Hello",
      role: "user",
      threadId: "thread-1",
    });

    expect(mockDb.chatMessage!.create).toHaveBeenCalledWith({
      data: {
        content: "Hello",
        role: "user",
        threadId: "thread-1",
      },
    });
  });
});
