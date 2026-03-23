import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { env } from "~/env";
import { db } from "./server/db";

const googleClientId = env.GOOGLE_CLIENT_ID ?? env.AUTH_GOOGLE_ID;
const googleClientSecret = env.GOOGLE_CLIENT_SECRET ?? env.AUTH_GOOGLE_SECRET;

const socialProviders =
  googleClientId && googleClientSecret
    ? {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        },
      }
    : undefined;

export const auth = betterAuth({
  ...(socialProviders ? { socialProviders } : {}),
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  baseURL: env.AUTH_URL,
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
  secret: env.AUTH_SECRET,
});
