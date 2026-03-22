import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../src/generated/prisma/client";
import { normalizePrismaSqliteUrl } from "../src/server/prisma-url";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run prisma/seed.ts");
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: normalizePrismaSqliteUrl(databaseUrl),
  }),
});

async function main() {
  await prisma.skill.upsert({
    create: { name: "Prisma ORM" },
    update: {},
    where: { name: "Prisma ORM" },
  });

  await prisma.skill.upsert({
    create: { name: "TypeScript" },
    update: {},
    where: { name: "TypeScript" },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
