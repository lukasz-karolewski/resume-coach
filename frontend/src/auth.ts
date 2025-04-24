import Google from "@auth/core/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";

import { PrismaClient } from "~/prisma/client";

const prisma = new PrismaClient();

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    session: async (params) => {
      // By default, only exposes a name, email, image. Need to add back the id at minimum.
      if ("user" in params) {
        params.session.user!.id = params.user.id;
      }
      return params.session;
    },
  },
});
