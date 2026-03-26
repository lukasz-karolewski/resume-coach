import { NextRequest } from "next/server";
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

  test("passes the scoped resume id into chat thread lookup", async () => {
    const request = new NextRequest(
      "http://localhost/api/chat/threads?resumeId=7",
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(listChatThreadsMock).toHaveBeenCalledWith({}, "user-123", 7);
  });

  test("returns a bad request for an invalid resume id", async () => {
    const request = new NextRequest(
      "http://localhost/api/chat/threads?resumeId=not-a-number",
    );

    const response = await GET(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid resumeId",
    });
    expect(listChatThreadsMock).not.toHaveBeenCalled();
  });

  test("does not leak unexpected backend errors", async () => {
    listChatThreadsMock.mockRejectedValue(new Error("database exploded"));

    const request = new NextRequest("http://localhost/api/chat/threads");

    const response = await GET(request);

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Internal server error",
    });
  });
});
