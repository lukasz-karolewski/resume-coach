import { oauthProviderAuthServerMetadata } from "@better-auth/oauth-provider";
import { auth } from "~/auth";

export const GET = oauthProviderAuthServerMetadata(auth, {
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=300, stale-while-revalidate=300",
  },
});
