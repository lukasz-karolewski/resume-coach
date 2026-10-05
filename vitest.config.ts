import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      ".next/**",
      "**/tests/**",
    ],
    globals: true,
    projects: [
      {
        test: {
          environment: "node",
          include: ["**/*.test.ts", "**/*.spec.ts"],
          name: "node",
          setupFiles: "./vitest.setup.ts",
        },
      },
      {
        test: {
          environment: "jsdom",
          include: ["**/*.test.tsx", "**/*.spec.tsx"],
          name: "jsdom",
          setupFiles: ["./vitest.setup.ts", "./vitest.setup.dom.ts"],
        },
      },
    ],
  },
});
