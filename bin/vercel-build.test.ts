import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { createVercelBuildPlan } from "./vercel-build";

describe("createVercelBuildPlan", () => {
  it("is wired into Vercel's build command", () => {
    const vercelConfig = JSON.parse(readFileSync("vercel.json", "utf8"));
    const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

    expect(vercelConfig.buildCommand).toBe("pnpm run vercel-build");
    expect(packageJson.scripts["vercel-build"]).toBe("tsx bin/vercel-build.ts");
  });

  it("deploys migrations with the unpooled database before a production build", () => {
    expect(
      createVercelBuildPlan({
        DATABASE_URL: "postgresql://pooled.example/resume_coach",
        DATABASE_URL_UNPOOLED: "postgresql://direct.example/resume_coach",
        VERCEL_ENV: "production",
      }),
    ).toEqual([
      {
        args: ["exec", "prisma", "migrate", "deploy"],
        databaseUrl: "postgresql://direct.example/resume_coach",
      },
      { args: ["run", "build"] },
    ]);
  });

  it("does not migrate preview deployments", () => {
    expect(
      createVercelBuildPlan({
        DATABASE_URL: "postgresql://production.example/resume_coach",
        VERCEL_ENV: "preview",
      }),
    ).toEqual([{ args: ["run", "build"] }]);
  });

  it("requires an unpooled database URL for production migrations", () => {
    expect(() =>
      createVercelBuildPlan({
        DATABASE_URL: "postgresql://pooled.example/resume_coach",
        VERCEL_ENV: "production",
      }),
    ).toThrow("DATABASE_URL_UNPOOLED");
  });
});
