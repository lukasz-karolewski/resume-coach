import "dotenv/config";
import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "~/env";
import { PrismaClient } from "~/generated/prisma/client";
import {
  type CachedClient,
  getOrCreateCachedClient,
} from "~/server/prisma-cache";

const globalForPrisma = globalThis as unknown as {
  prismaCache: CachedClient<PrismaClient> | undefined;
  // Compatibility with the previous development cache shape.
  prisma: PrismaClient | undefined;
};

const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL ?? process.env.DATABASE_URL ?? "",
});

function createPrismaClient() {
  return new PrismaClient({
    adapter,
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

const prismaCache =
  env.NODE_ENV === "production"
    ? {
        client: createPrismaClient(),
        clientConstructor: PrismaClient,
      }
    : getOrCreateCachedClient(
        globalForPrisma.prismaCache,
        PrismaClient,
        createPrismaClient,
      );

export const db = prismaCache.client;

if (env.NODE_ENV !== "production") {
  const staleClient =
    globalForPrisma.prismaCache?.client ?? globalForPrisma.prisma;

  if (staleClient && staleClient !== db) {
    void staleClient.$disconnect();
  }

  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaCache = prismaCache;
}
