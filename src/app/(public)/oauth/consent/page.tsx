import { headers } from "next/headers";
import { auth } from "~/auth";
import { AuthScreen } from "~/components/auth/auth-screen";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { ConsentForm } from "./consent-form";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function OAuthConsentPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const values = await searchParams;
  const clientId = Array.isArray(values.client_id)
    ? values.client_id[0]
    : values.client_id;
  const requestedScope = Array.isArray(values.scope)
    ? values.scope[0]
    : values.scope;

  if (!clientId) {
    return (
      <AuthScreen
        description="This authorization request is incomplete or has expired."
        footer="You can close this window and reconnect from your MCP client."
        layout="focused"
        title="Invalid authorization request"
      >
        <Alert variant="destructive">
          <AlertDescription>A client identifier is required.</AlertDescription>
        </Alert>
      </AuthScreen>
    );
  }

  const client = await auth.api.getOAuthClientPublic({
    headers: await headers(),
    query: { client_id: clientId },
  });
  const scopes = (requestedScope ?? "mcp:tools").split(" ").filter(Boolean);

  return (
    <AuthScreen
      description={`${client.client_name ?? "An external application"} wants to connect to your Resume Coach account.`}
      footer="You can revoke access later by revoking the OAuth session."
      layout="focused"
      title="Allow access?"
    >
      <div className="space-y-3">
        <p className="text-sm font-medium">Requested access</p>
        <ul className="divide-y rounded-lg border">
          {scopes.map((scope) => (
            <li className="px-3 py-2 text-sm" key={scope}>
              {scope}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          The client can use Resume Coach tools on your behalf. It only sees
          data owned by your account.
        </p>
      </div>

      <ConsentForm />
    </AuthScreen>
  );
}
