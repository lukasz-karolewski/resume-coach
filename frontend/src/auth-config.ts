import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export default {
  callbacks: {
    jwt({ token, user }) {
      if (user) token.userId = user.id;
      return token;
    },
    session: (params) => {
      // By default, only exposes a name, email, image. Need to add back the id at minimum.
      if ("user" in params) {
        params.session.user.id = params.token.userId as string;
      }
      return params.session;
    },
  },
  providers: [Google],
  trustHost: true,
} satisfies NextAuthConfig;
