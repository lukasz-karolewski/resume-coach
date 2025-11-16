"server-only";

import type { PrismaClient } from "~/generated/prisma/client";

/**
 * Get user info
 */
export async function getUserInfo(db: PrismaClient, userId: string) {
  const user = await db.user.findFirst({
    where: { id: userId },
  });
  return user;
}
