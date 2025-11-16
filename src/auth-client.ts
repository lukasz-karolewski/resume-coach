// import type { NextAuthConfig } from "next-auth";
// import Google from "next-auth/providers/google";

// export default {
//   callbacks: {
//     jwt({ token, user }) {
//       if (user) token.userId = user.id;
//       return token;
//     },
//     session: (params) => {
//       // By default, only exposes a name, email, image. Need to add back the id at minimum.
//       params.session.user.id = params.token.userId as string;
//       return params.session;
//     },
//   },
//   providers: [Google],
//   trustHost: true,
// } satisfies NextAuthConfig;

import { createAuthClient } from "better-auth/react";
export const { signIn, signUp, signOut, useSession } = createAuthClient({
  // Use relative baseURL to work in all environments (dev, test, production)
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000",
});
