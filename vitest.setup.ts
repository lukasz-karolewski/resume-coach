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
class ResizeObserverMock implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

// Mock IntersectionObserver
class IntersectionObserverMock implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly scrollMargin = "";
  readonly thresholds = [];

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

global.IntersectionObserver = IntersectionObserverMock;

global.CSS = {
  ...global.CSS,
  supports: () => true, // Or a more specific mock based on your needs
};
