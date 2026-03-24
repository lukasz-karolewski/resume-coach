"use client";

import { useRouter } from "next/navigation";

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

export function SignOut(props: React.ComponentPropsWithRef<typeof Button>) {
  const router = useRouter();

  return (
    <Button
      onClick={async () => {
        await signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push("/login");
            },
          },
        });
      }}
      variant="ghost"
      {...props}
    >
      Sign Out
    </Button>
  );
}
