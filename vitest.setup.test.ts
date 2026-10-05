import { expect, test } from "vitest";

test("runs server tests without browser globals", () => {
  expect(globalThis).not.toHaveProperty("window");
  expect(globalThis).not.toHaveProperty("document");
});

test("allows server-only modules to load in unit tests", async () => {
  await expect(import("server-only")).resolves.toBeDefined();
});

test("uses a deterministic environment instead of local credentials", async () => {
  const { env } = await import("~/env");
  expect(env.NODE_ENV).toBe("test");
  expect(env.DATABASE_URL === "file:./test.db").toBe(true);
});
