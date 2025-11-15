"use client";
import { redirect } from "next/navigation";
import { signIn, signOut } from "~/auth-client";
import { Button } from "./button";

export function SignIn({
  provider,
  ...props
}: { provider: string } & React.ComponentPropsWithRef<typeof Button>) {
  return (
    <Button
      onClick={async () => {
        await signIn.social({
          /**
           * A URL to redirect after the user authenticates with the provider
           * @default "/"
           */
          callbackURL: "/resume",
          /**
           * disable the automatic redirect to the provider.
           * @default false
           */
          disableRedirect: false,
          /**
           * A URL to redirect if an error occurs during the sign in process
           */
          errorCallbackURL: "/error",
          /**
           * A URL to redirect if the user is newly registered
           */
          newUserCallbackURL: "/resume",
          /**
           * The social provider ID
           * @example "github", "google", "apple"
           */
          provider,
        });
      }}
      {...props}
    >
      Sign In
    </Button>
  );
}

export function SignOut(props: React.ComponentPropsWithRef<typeof Button>) {
  return (
    <Button
      onClick={async () => {
        await signOut({
          fetchOptions: {
            onSuccess: () => {
              redirect("/login"); // redirect to login page
            },
          },
        });
      }}
      variant="ghost"
      className="w-full p-0"
      {...props}
    >
      Sign Out
    </Button>
  );
}
