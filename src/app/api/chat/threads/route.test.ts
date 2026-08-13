import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET } from "./route";

const { getSessionMock, headersMock, listChatThreadsMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  headersMock: vi.fn(),
  listChatThreadsMock: vi.fn(),
}));

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
  listChatThreads: listChatThreadsMock,
}));

describe("GET /api/chat/threads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue(new Headers());
    getSessionMock.mockResolvedValue({
      user: {
        id: "user-123",
      },
    });
    listChatThreadsMock.mockResolvedValue([]);
  });

  test("lists every conversation for the signed in user", async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(listChatThreadsMock).toHaveBeenCalledWith({}, "user-123");
  });

  test("does not leak unexpected backend errors", async () => {
    listChatThreadsMock.mockRejectedValue(new Error("database exploded"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Internal server error",
    });
  });
});
