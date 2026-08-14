import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import Assistant from "./assistant";

/**
 * Unlike `assistant.test.tsx`, this file drives the real `useChatStream` hook:
 * the reported bug was that the visible conversation disappeared when the agent
 * moved the user to another resume, which only shows up end to end.
 */

const { navigationState, push } = vi.hoisted(() => ({
  navigationState: {
    pathname: "/resume/Res001",
  },
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => navigationState.pathname),
  useRouter: vi.fn(() => ({
    push,
  })),
}));

const STORED_REPLY = "Cloned it. Want a punchier summary next?";

describe("Assistant conversation continuity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    navigationState.pathname = "/resume/Res001";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (input === "/api/chat/threads") {
          return {
            json: async () => ({
              threads: [
                {
                  createdAt: "2026-03-23T00:00:00.000Z",
                  id: "thread-123",
                  summary: "Clone my resume",
                },
              ],
            }),
            ok: true,
          } as Response;
        }

        if (input === "/api/chat/threads/thread-123") {
          return {
            json: async () => ({
              messages: [
                {
                  content: STORED_REPLY,
                  createdAt: "2026-03-24T00:00:00.000Z",
                  id: "msg-1",
                  role: "assistant",
                },
              ],
            }),
            ok: true,
          } as Response;
        }

        throw new Error(`Unexpected fetch input: ${String(input)}`);
      }),
    );
  });

  test("keeps the visible conversation when the user lands on another resume", async () => {
    sessionStorage.setItem("chatThreadId", "thread-123");

    const { rerender } = render(<Assistant />);

    fireEvent.click(screen.getByLabelText("Open chat"));

    expect(await screen.findByText(STORED_REPLY)).toBeInTheDocument();

    navigationState.pathname = "/resume/Res042";
    rerender(<Assistant />);

    expect(screen.getByText(STORED_REPLY)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(STORED_REPLY)).toBeInTheDocument();
    });
  });
});
