import { describe, expect, test } from "vitest";
import { getBetterAuthUrl } from "./env-url";

describe("getBetterAuthUrl", () => {
  test("prefers the explicitly configured URL", () => {
    expect(
      getBetterAuthUrl({
        BETTER_AUTH_URL: "https://resume.example.com",
        VERCEL_URL: "preview.vercel.app",
      }),
    ).toBe("https://resume.example.com");
  });

  test("uses the Vercel production hostname when available", () => {
    expect(
      getBetterAuthUrl({
        VERCEL_ENV: "production",
        VERCEL_PROJECT_PRODUCTION_URL: "resume-coach.vercel.app",
        VERCEL_URL: "resume-coach-git-feature.vercel.app",
      }),
    ).toBe("https://resume-coach.vercel.app");
  });

  test("uses the deployment hostname for previews", () => {
    expect(
      getBetterAuthUrl({
        VERCEL_ENV: "preview",
        VERCEL_PROJECT_PRODUCTION_URL: "resume-coach.vercel.app",
        VERCEL_URL: "resume-coach-git-feature.vercel.app",
      }),
    ).toBe("https://resume-coach-git-feature.vercel.app");
  });

  test("leaves the URL undefined outside Vercel when unset", () => {
    expect(getBetterAuthUrl({})).toBeUndefined();
  });
});
