"use client";

import { signIn } from "~/auth-client";

import { Button } from "./button";

export function SignIn({
  provider,
  ...props
}: { provider: string } & React.ComponentPropsWithRef<typeof Button>) {
  return (
    <Button
      onClick={async () => {
        await signIn.social({
          callbackURL: "/jobs",
          disableRedirect: false,
          errorCallbackURL: "/error",
          newUserCallbackURL: "/jobs",
          provider,
        });
      }}
      {...props}
    >
      Sign In
    </Button>
  );
}
