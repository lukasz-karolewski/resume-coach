import { prismaAdapter } from "better-auth/adapters/prisma";
import { betterAuth } from "better-auth/minimal";

import { createAuthPlugins } from "~/auth-plugins";
import { env } from "~/env";
import { fetchClientMetadataResource } from "~/server/lib/cimdTransport";
import { db } from "./server/db";

export const auth = betterAuth({
  account: {
    accountLinking: {
      enabled: true,
    },
  },
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: createAuthPlugins(fetchClientMetadataResource),
  secret: env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID as string,
      clientSecret: env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
