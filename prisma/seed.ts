import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});

const prisma = new PrismaClient({
  adapter,
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
