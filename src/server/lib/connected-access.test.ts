import { describe, expect, test, vi } from "vitest";

import { disconnectApp, listConnectedApps } from "./connected-access";

describe("connected access", () => {
  test("lists the current user's grants and whether they can refresh", async () => {
    const createdAt = new Date("2026-09-20T18:00:00.000Z");
    const oauthConsent = {
      findMany: vi.fn().mockResolvedValue([
        {
          clientId: "chatgpt-client",
          createdAt,
          id: "consent-1",
          oauthClient: {
            name: "ChatGPT",
            uri: "https://chatgpt.com",
          },
          scopes: ["openid", "offline_access", "mcp:tools"],
          updatedAt: createdAt,
        },
      ]),
    };
    const oauthRefreshToken = {
      findMany: vi.fn().mockResolvedValue([
        {
          clientId: "chatgpt-client",
          expiresAt: new Date("2026-10-20T18:00:00.000Z"),
        },
      ]),
    };

    await expect(
      listConnectedApps({ oauthConsent, oauthRefreshToken } as never, {
        userId: "user-1",
      }),
    ).resolves.toEqual([
      {
        clientId: "chatgpt-client",
        connectedAt: createdAt,
        id: "consent-1",
        isActive: true,
        name: "ChatGPT",
        permissions: [
          "Confirm who you are",
          "Stay connected until you disconnect it",
          "Use Resume Coach tools on your behalf",
        ],
        uri: "https://chatgpt.com",
      },
    ]);
    expect(oauthConsent.findMany).toHaveBeenCalledWith({
      include: { oauthClient: true },
      orderBy: { createdAt: "desc" },
      where: { userId: "user-1" },
    });
    expect(oauthRefreshToken.findMany).toHaveBeenCalledWith({
      select: { clientId: true },
      where: {
        clientId: { in: ["chatgpt-client"] },
        expiresAt: { gt: expect.any(Date) },
        revoked: null,
        userId: "user-1",
      },
    });
  });

  test("deletes a user's tokens and grant together", async () => {
    const deleteAccessTokens = vi.fn().mockResolvedValue({ count: 1 });
    const deleteRefreshTokens = vi.fn().mockResolvedValue({ count: 1 });
    const deleteConsents = vi.fn().mockResolvedValue({ count: 1 });
    const db = {
      $transaction: vi.fn(async (operations: Promise<unknown>[]) =>
        Promise.all(operations),
      ),
      oauthAccessToken: { deleteMany: deleteAccessTokens },
      oauthConsent: { deleteMany: deleteConsents },
      oauthRefreshToken: { deleteMany: deleteRefreshTokens },
    };

    await expect(
      disconnectApp(db as never, {
        clientId: "chatgpt-client",
        userId: "user-1",
      }),
    ).resolves.toEqual({ disconnected: true });

    const where = { clientId: "chatgpt-client", userId: "user-1" };
    expect(deleteAccessTokens).toHaveBeenCalledWith({ where });
    expect(deleteRefreshTokens).toHaveBeenCalledWith({ where });
    expect(deleteConsents).toHaveBeenCalledWith({ where });
  });

  test("does not expose a non-web client URI as a profile link", async () => {
    const db = {
      oauthConsent: {
        findMany: vi.fn().mockResolvedValue([
          {
            clientId: "unsafe-client",
            createdAt: new Date("2026-09-20T18:00:00.000Z"),
            id: "consent-2",
            oauthClient: { name: "Unsafe", uri: "javascript:alert(1)" },
            scopes: ["mcp:tools"],
          },
        ]),
      },
      oauthRefreshToken: { findMany: vi.fn().mockResolvedValue([]) },
    };

    const apps = await listConnectedApps(db as never, { userId: "user-1" });

    expect(apps[0]?.uri).toBeNull();
  });
});
