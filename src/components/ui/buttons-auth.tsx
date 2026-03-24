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
          callbackURL: "/resume",
          disableRedirect: false,
          errorCallbackURL: "/error",
          newUserCallbackURL: "/resume",
          provider,
        });
      }}
      {...props}
    >
      Sign In
    </Button>
  );
}
