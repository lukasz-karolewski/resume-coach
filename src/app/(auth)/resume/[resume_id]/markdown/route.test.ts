import { beforeEach, describe, expect, test, vi } from "vitest";

const { getSession, getResumeMarkdown, headersMock } = vi.hoisted(() => ({
  getResumeMarkdown: vi.fn(),
  getSession: vi.fn(),
  headersMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("~/auth", () => ({
  auth: {
    api: {
      getSession,
    },
  },
}));

vi.mock("~/server/db", () => ({
  db: {},
}));

vi.mock("~/server/lib/resume", () => ({
  getResumeMarkdown,
}));

import { GET } from "./route";

describe("resume markdown route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    headersMock.mockResolvedValue(new Headers());
  });

  test("returns unauthorized when no session is present", async () => {
    getSession.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/resume/1/markdown"),
      {
        params: Promise.resolve({ resume_id: "1" }),
      } as RouteContext<"/resume/[resume_id]/markdown">,
    );

    expect(response.status).toBe(401);
    await expect(response.text()).resolves.toBe("Unauthorized");
  });

  test("returns markdown as plain text for an owned resume", async () => {
    getSession.mockResolvedValue({
      user: {
        id: "user-123",
      },
    });
    getResumeMarkdown.mockResolvedValue("# Jane Doe\n");

    const response = await GET(
      new Request("http://localhost/resume/1/markdown"),
      {
        params: Promise.resolve({ resume_id: "1" }),
      } as RouteContext<"/resume/[resume_id]/markdown">,
    );

    expect(getResumeMarkdown).toHaveBeenCalledWith({}, "user-123", { id: 1 });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "text/plain; charset=utf-8",
    );
    expect(response.headers.get("Content-Disposition")).toBe(
      'inline; filename="resume-1.md"',
    );
    await expect(response.text()).resolves.toBe("# Jane Doe\n");
  });

  test("returns not found for a non-numeric resume id", async () => {
    getSession.mockResolvedValue({
      user: {
        id: "user-123",
      },
    });

    const response = await GET(
      new Request("http://localhost/resume/not-a-number/markdown"),
      {
        params: Promise.resolve({ resume_id: "not-a-number" }),
      } as RouteContext<"/resume/[resume_id]/markdown">,
    );

    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toBe("Resume not found");
  });

  test("returns not found when the resume lookup fails", async () => {
    getSession.mockResolvedValue({
      user: {
        id: "user-123",
      },
    });
    getResumeMarkdown.mockRejectedValue(new Error("Resume not found"));

    const response = await GET(
      new Request("http://localhost/resume/1/markdown"),
      {
        params: Promise.resolve({ resume_id: "1" }),
      } as RouteContext<"/resume/[resume_id]/markdown">,
    );

    expect(response.status).toBe(404);
    await expect(response.text()).resolves.toBe("Resume not found");
  });
});
