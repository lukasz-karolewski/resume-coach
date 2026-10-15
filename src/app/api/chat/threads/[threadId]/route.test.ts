import { beforeEach, describe, expect, test, vi } from "vitest";

const { getChatThreadMessagesMock, getSessionMock, headersMock } = vi.hoisted(
  () => ({
    getChatThreadMessagesMock: vi.fn(),
    getSessionMock: vi.fn(),
    headersMock: vi.fn(),
  }),
);

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("~/auth", () => ({
  auth: {
    api: {
      getSession: getSessionMock,
    },
  },
}));

vi.mock("~/server/db", () => ({
  db: {},
}));

vi.mock("~/server/lib/chat", () => ({
  getChatThreadMessages: getChatThreadMessagesMock,
}));

import { GET } from "./route";

function getThread(threadId: string) {
  return GET(new Request(`http://localhost/api/chat/threads/${threadId}`), {
    params: Promise.resolve({ threadId }),
  } as RouteContext<"/api/chat/threads/[threadId]">);
}

describe("GET /api/chat/threads/[threadId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue(new Headers());
    getSessionMock.mockResolvedValue({
      user: {
        id: "user-123",
      },
    });
  });

  test("returns unauthorized when the session is missing", async () => {
    getSessionMock.mockResolvedValue(null);

    const response = await getThread("thread-123");

    expect(response.status).toBe(401);
    expect(getChatThreadMessagesMock).not.toHaveBeenCalled();
  });

  test("returns the owned thread messages", async () => {
    getChatThreadMessagesMock.mockResolvedValue({
      createdAt: new Date("2026-03-24T00:00:00.000Z"),
      id: "thread-123",
      messages: [
        {
          content: "Hello",
          createdAt: new Date("2026-03-24T00:00:01.000Z"),
          id: "msg-1",
          role: "user",
        },
      ],
    });

    const response = await getThread("thread-123");

    expect(response.status).toBe(200);
    expect(getChatThreadMessagesMock).toHaveBeenCalledWith(
      {},
      "user-123",
      "thread-123",
    );
    await expect(response.json()).resolves.toMatchObject({
      id: "thread-123",
      messages: [
        {
          content: "Hello",
          id: "msg-1",
          role: "user",
        },
      ],
    });
  });

  test("returns not found for an unknown thread", async () => {
    getChatThreadMessagesMock.mockRejectedValue(
      new Error("Conversation not found"),
    );

    const response = await getThread("thread-404");

    expect(response.status).toBe(404);
  });

  test("does not leak unexpected backend errors", async () => {
    getChatThreadMessagesMock.mockRejectedValue(new Error("database exploded"));

    const response = await getThread("thread-500");

    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("database exploded");
  });
});
