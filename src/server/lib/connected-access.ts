import "server-only";

import { z } from "zod";

import type { PrismaClient } from "~/generated/prisma/client";
import { describeScope } from "~/server/lib/oauth";

export const disconnectConnectedAppInputSchema = z.object({
  clientId: z.string().min(1),
});

function safeClientUri(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}

export async function listConnectedApps(
  db: PrismaClient,
  params: { userId: string },
) {
  const consents = await db.oauthConsent.findMany({
    include: { oauthClient: true },
    orderBy: { createdAt: "desc" },
    where: { userId: params.userId },
  });

  const liveRefreshTokens = await db.oauthRefreshToken.findMany({
    select: { clientId: true },
    where: {
      clientId: { in: consents.map((consent) => consent.clientId) },
      expiresAt: { gt: new Date() },
      revoked: null,
      userId: params.userId,
    },
  });
  const activeClientIds = new Set(
    liveRefreshTokens.map((token) => token.clientId),
  );

  return consents.map((consent) => ({
    clientId: consent.clientId,
    connectedAt: consent.createdAt,
    id: consent.id,
    isActive: activeClientIds.has(consent.clientId),
    name: consent.oauthClient.name ?? consent.clientId,
    permissions: consent.scopes.map(describeScope),
    uri: safeClientUri(consent.oauthClient.uri),
  }));
}

export async function disconnectApp(
  db: PrismaClient,
  params: z.infer<typeof disconnectConnectedAppInputSchema> & {
    userId: string;
  },
) {
  const where = { clientId: params.clientId, userId: params.userId };
  const [, , consents] = await db.$transaction([
    db.oauthAccessToken.deleteMany({ where }),
    db.oauthRefreshToken.deleteMany({ where }),
    db.oauthConsent.deleteMany({ where }),
  ]);

  return { disconnected: consents.count > 0 };
}
