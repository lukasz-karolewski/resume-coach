import { createTRPCClient, loggerLink, unstable_localLink } from "@trpc/client";
import { cookies } from "next/headers";
import "server-only";
import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import { transformer } from "./shared";

export const api = createTRPCClient<typeof appRouter>({
  links: [
    loggerLink({
      enabled: (op) =>
        process.env.NODE_ENV === "development" ||
        (op.direction === "down" && op.result instanceof Error),
    }),
    unstable_localLink({
      createContext: async () => {
        // Create your context here
        const cookiesList = await cookies();
        return createTRPCContext({
          headers: new Headers({
            cookie: cookiesList.toString(),
            "x-trpc-source": "rsc",
          }),
        });
      },
      onError: (opts) => {
        // Log errors here, similarly to how you would in an API route
        console.error("Error:", opts.error);
      },
      router: appRouter,
      transformer,
    }),
  ],
});
