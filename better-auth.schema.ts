import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { betterAuth } from "better-auth";
import { createAuthPlugins } from "~/auth-plugins";

// The schema CLI cannot import the live auth module because it reaches the
// server-only Prisma client. Auth tables come from core and the shared plugins;
// the CLI flags in package.json supply the Prisma/PostgreSQL adapter details.
export const auth = betterAuth({
  plugins: createAuthPlugins(fetchClientMetadataResource),
});
