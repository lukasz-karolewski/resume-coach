import { describe, expect, test, vi } from "vitest";

import { auth } from "~/auth";
import { createTRPCContext } from "./trpc";

vi.mock("~/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("~/server/db", () => ({
  db: { resume: {} },
}));

describe("createTRPCContext", () => {
  test("passes caller-provided headers to Better Auth", async () => {
    const headers = new Headers({ cookie: "session=test-session" });
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    const context = await createTRPCContext({ headers });

    expect(auth.api.getSession).toHaveBeenCalledWith({ headers });
    expect(context.headers).toBe(headers);
  });
});
