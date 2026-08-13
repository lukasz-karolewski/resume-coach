"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "~/auth";

export async function respondToOAuthConsent(formData: FormData) {
  const oauthQuery = formData.get("oauthQuery");
  const decision = formData.get("decision");

  if (typeof oauthQuery !== "string" || !oauthQuery) {
    throw new Error("Missing OAuth authorization request");
  }

  const result = await auth.api.oauth2Consent({
    body: {
      accept: decision === "allow",
      oauth_query: oauthQuery,
    },
    headers: await headers(),
  });

  redirect(result.url);
}
