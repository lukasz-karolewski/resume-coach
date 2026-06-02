import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { auth } from "~/auth";
import AuthLayout from "./layout";

const mockConnection = vi.fn();
const mockHeaders = vi.fn();
const mockRedirect = vi.fn();

vi.mock("next/server", () => ({
  connection: () => mockConnection(),
}));

vi.mock("next/headers", () => ({
  headers: () => mockHeaders(),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    mockRedirect(path);
    throw new Error("NEXT_REDIRECT");
  },
}));

vi.mock("~/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("~/components/assistant", () => ({
  default: () => <div>Assistant</div>,
}));

vi.mock("~/components/ui/footer", () => ({
  default: () => <footer>Footer</footer>,
}));

vi.mock("~/components/ui/top-nav", () => ({
  default: () => <nav>Top nav</nav>,
}));

describe("AuthLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnection.mockResolvedValue(undefined);
    mockHeaders.mockResolvedValue(new Headers());
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user-123" },
    });
  });

  test("defers authenticated routes to request time before reading the session", async () => {
    render(await AuthLayout({ children: <div>Authenticated content</div> }));

    expect(mockConnection).toHaveBeenCalledBefore(
      vi.mocked(auth.api.getSession),
    );
    expect(screen.getByText("Authenticated content")).toBeInTheDocument();
  });

  test("redirects anonymous users to the home page", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    await expect(
      AuthLayout({ children: <div>Authenticated content</div> }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(mockRedirect).toHaveBeenCalledWith("/");
  });
});
