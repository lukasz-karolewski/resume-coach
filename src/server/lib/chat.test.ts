import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PrismaClient } from "~/generated/prisma/client";
import { getChatThreadMessages, listChatThreads } from "./chat";

type MockDb = {
  chatThread: {
    findFirst: ReturnType<typeof vi.fn>;
    findMany: ReturnType<typeof vi.fn>;
  };
};

describe("chat lib", () => {
  let mockDb: MockDb;

  beforeEach(() => {
    mockDb = {
      chatThread: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    };
  });

  test("lists the user's chat threads summarized by the first user message", async () => {
    const longPrompt = `Tailor   my resume\n\nfor ${"a".repeat(200)}`;
    mockDb.chatThread.findMany.mockResolvedValue([
      {
        createdAt: new Date("2026-03-23T00:00:00.000Z"),
        id: "thread-1",
        messages: [{ content: longPrompt }],
      },
      {
        createdAt: new Date("2026-03-24T00:00:00.000Z"),
        id: "thread-2",
        messages: [],
      },
    ]);

    const [summarized, empty] = await listChatThreads(
      mockDb as unknown as PrismaClient,
      "user-123",
    );

    // Whitespace collapses and the summary is capped at 100 characters.
    expect(summarized).toMatchObject({ id: "thread-1" });
    expect(summarized?.summary).toHaveLength(100);
    expect(summarized?.summary.startsWith("Tailor my resume for a")).toBe(true);
    // A thread without a user message still gets a non-empty summary.
    expect(empty?.summary).toEqual(expect.any(String));
    expect(empty?.summary.trim()).not.toBe("");
    expect(mockDb.chatThread.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-123" } }),
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
    expect(mockDb.chatThread.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "thread-1", userId: "user-123" },
      }),
    );
  });

  test("reports NOT_FOUND for a conversation outside the user's scope", async () => {
    mockDb.chatThread.findFirst.mockResolvedValue(null);

    await expect(
      getChatThreadMessages(
        mockDb as unknown as PrismaClient,
        "user-123",
        "thread-other",
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
