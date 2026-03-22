import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { env } from "~/env";
import { db } from "./server/db";

function getAuthUrl(rawAuthUrl: string) {
  const normalizedAuthUrl =
    rawAuthUrl.startsWith("http://") || rawAuthUrl.startsWith("https://")
      ? rawAuthUrl
      : `https://${rawAuthUrl}`;

  return new URL(normalizedAuthUrl);
}

const authUrl = getAuthUrl(env.BETTER_AUTH_URL);
const authBasePath =
  authUrl.pathname === "/"
    ? "/api/auth"
    : authUrl.pathname.replace(/\/$/, "") || "/api/auth";

export const auth = betterAuth({
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  basePath: authBasePath,
  baseURL: authUrl.origin,
  database: prismaAdapter(db, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    },
  },
  trustedOrigins: [authUrl.origin],
});
