import { spawnSync } from "node:child_process";

type BuildEnvironment = Record<string, string | undefined>;

type BuildStep = {
  args: string[];
  databaseUrl?: string;
};

export function createVercelBuildPlan(env: BuildEnvironment): BuildStep[] {
  const buildStep: BuildStep = { args: ["run", "build"] };

  if (env.VERCEL_ENV !== "production") return [buildStep];

  if (!env.DATABASE_URL_UNPOOLED) {
    throw new Error(
      "DATABASE_URL_UNPOOLED is required for production database migrations",
    );
  }

  return [
    {
      args: ["exec", "prisma", "migrate", "deploy"],
      databaseUrl: env.DATABASE_URL_UNPOOLED,
    },
    buildStep,
  ];
}

export function runVercelBuild(env: NodeJS.ProcessEnv = process.env): void {
  for (const step of createVercelBuildPlan(env)) {
    const result = spawnSync("pnpm", step.args, {
      env: step.databaseUrl ? { ...env, DATABASE_URL: step.databaseUrl } : env,
      stdio: "inherit",
    });

    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runVercelBuild();
}
