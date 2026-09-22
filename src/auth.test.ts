import { beforeEach, expect, test, vi } from "vitest";

const { betterAuth, createAuthPlugins, prismaAdapter } = vi.hoisted(() => ({
  betterAuth: vi.fn(() => ({ handler: vi.fn() })),
  createAuthPlugins: vi.fn(() => []),
  prismaAdapter: vi.fn(() => ({ id: "prisma-adapter" })),
}));

vi.unmock("~/auth");
vi.mock("better-auth", () => ({
  betterAuth: () => {
    throw new Error(
      "The full Better Auth entry must not initialize runtime auth",
    );
  },
}));
vi.mock("better-auth/minimal", () => ({ betterAuth }));
vi.mock("better-auth/adapters/prisma", () => ({ prismaAdapter }));
vi.mock("~/auth-plugins", () => ({ createAuthPlugins }));
vi.mock("~/env", () => ({
  env: {
    BETTER_AUTH_SECRET: "x".repeat(32),
    BETTER_AUTH_URL: "http://localhost:3000",
    GOOGLE_CLIENT_ID: "google-client",
    GOOGLE_CLIENT_SECRET: "google-secret",
  },
}));
vi.mock("~/server/db", () => ({ db: { id: "db" } }));
vi.mock("~/server/lib/cimdTransport", () => ({
  fetchClientMetadataResource: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

test("builds runtime auth from the minimal entry with the Prisma adapter", async () => {
  await import("./auth");

  expect(prismaAdapter).toHaveBeenCalledWith(
    { id: "db" },
    { provider: "postgresql" },
  );
  expect(betterAuth).toHaveBeenCalledWith(
    expect.objectContaining({ database: { id: "prisma-adapter" } }),
  );
});
