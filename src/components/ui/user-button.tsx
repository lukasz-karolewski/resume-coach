import { headers } from "next/headers";

import { auth } from "~/auth";

import { SignIn } from "./buttons-auth";
import { UserMenu } from "./user-menu";

export default async function UserButton() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return <SignIn provider="google" size="sm" />;
  }

  const initials =
    session.user.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? session.user.email.slice(0, 2).toUpperCase();

  return (
    <UserMenu
      email={session.user.email}
      image={session.user.image}
      initials={initials}
      name={session.user.name}
    />
  );
}
