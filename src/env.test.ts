// @vitest-environment node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

describe("build environment loading", () => {
  test.each([
    ["production", "https://resume-coach.vercel.app"],
    ["preview", "https://resume-coach-preview.vercel.app"],
  ])(
    "loads through Node ESM for a %s deployment",
    (deployment, expectedUrl) => {
      const envModuleUrl = new URL("./env.js", import.meta.url).href;
      const result = spawnSync(
        process.execPath,
        [
          "--input-type=module",
          "--eval",
          `const { env } = await import(${JSON.stringify(envModuleUrl)}); console.log(JSON.stringify(env.BETTER_AUTH_URL));`,
        ],
        {
          cwd: fileURLToPath(new URL("../", import.meta.url)),
          encoding: "utf8",
          env: {
            ...process.env,
            BETTER_AUTH_SECRET: "build-test-secret".repeat(3),
            BETTER_AUTH_URL: "",
            NODE_ENV: "production",
            SKIP_ENV_VALIDATION: "",
            VERCEL_ENV: deployment,
            VERCEL_PROJECT_PRODUCTION_URL: "resume-coach.vercel.app",
            VERCEL_URL: "resume-coach-preview.vercel.app",
          },
        },
      );

      expect(result.status, result.stderr).toBe(0);
      expect(JSON.parse(result.stdout)).toBe(expectedUrl);
    },
  );
});
