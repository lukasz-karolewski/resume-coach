import "dotenv/config";

import { defineConfig, env } from "prisma/config";

import { normalizePrismaSqliteUrl } from "./src/server/prisma-url";

export default defineConfig({
  datasource: {
    url: normalizePrismaSqliteUrl(env("DATABASE_URL")),
  },
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  schema: "prisma/schema.prisma",
});
