import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock server-only for testing
vi.mock("server-only", () => ({}));

// Mock PrismaClient for testing
vi.mock("~/generated/prisma/client", () => ({
  PrismaClient: vi.fn(),
}));

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
}));

global.CSS = {
  ...global.CSS,
  supports: () => true, // Or a more specific mock based on your needs
};
