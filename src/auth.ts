import { oauthProvider } from "@better-auth/oauth-provider";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins/jwt";

import { env } from "~/env";
import {
  MCP_OAUTH_SCOPE,
  MCP_RESOURCE,
  OAUTH_SCOPES,
} from "~/server/lib/oauth";
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
  plugins: [
    jwt(),
    oauthProvider({
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      clientRegistrationAllowedScopes: [...OAUTH_SCOPES],
      clientRegistrationDefaultScopes: [MCP_OAUTH_SCOPE],
      consentPage: "/oauth/consent",
      loginPage: "/login",
      scopes: [...OAUTH_SCOPES],
      silenceWarnings: {
        oauthAuthServerConfig: true,
      },
      validAudiences: [MCP_RESOURCE],
    }),
    nextCookies(),
  ],
  secret: env.BETTER_AUTH_SECRET,
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID as string,
      clientSecret: env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
