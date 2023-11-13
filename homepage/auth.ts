import Google from "@auth/core/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import NextAuth from "next-auth";

const prisma = new PrismaClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // pages: {
  //   signIn: "/login",
  // },
  providers: [
    // Credentials({
    //   async authorize(credentials) {
    //     const parsedCredentials = z
    //       .object({ email: z.string().email(), password: z.string().min(6) })
    //       .safeParse(credentials);

    //     if (parsedCredentials.success) {
    //       const { email, password } = parsedCredentials.data;
    //       const user = await getUser(email);
    //       if (!user) return null;
    //       const passwordsMatch = await bcrypt.compare(password, user.password);

    //       if (passwordsMatch) return user;
    //     }

    //     console.log("Invalid credentials");
    //     return null;
    //   },
    // }),
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
});
