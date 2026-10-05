import { vi } from "vitest";

// Mock server-only for testing
vi.mock("server-only", () => ({}));

// Mock env
vi.mock("~/env", () => ({
  env: {
    BETTER_AUTH_SECRET: "test-secret-".repeat(4),
    BETTER_AUTH_URL: "http://localhost:3000",
    DATABASE_URL: "file:./test.db",
    NODE_ENV: "test",
  },
}));

// Mock db
vi.mock("~/server/db", () => ({
  db: {},
}));

// Mock PrismaClient for testing
vi.mock("~/generated/prisma/client", () => ({
  EducationType: {
    CERTIFICATION: "CERTIFICATION",
    EDUCATION: "EDUCATION",
  },
  PrismaClient: vi.fn(),
}));

// Mock runtime authentication
vi.mock("~/auth", () => ({
  auth: vi.fn(),
}));
