import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock server-only for testing
vi.mock("server-only", () => ({}));

// Mock env
vi.mock("~/env", () => ({
  env: {
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

// Mock next-auth
vi.mock("~/auth", () => ({
  auth: vi.fn(),
}));

// Mock ResizeObserver as a proper class constructor
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.ResizeObserver = ResizeObserverMock as any;

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
global.IntersectionObserver = IntersectionObserverMock as any;

global.CSS = {
  ...global.CSS,
  supports: () => true, // Or a more specific mock based on your needs
};
