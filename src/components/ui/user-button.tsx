import { headers } from "next/headers";
import { auth } from "~/auth";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { SignIn, SignOut } from "./buttons-auth";
export default async function UserButton() {
  const session = await auth.api.getSession({
    headers: await headers(), // you need to pass the headers object.
  });
  if (!session?.user) return <SignIn provider="google" />;
  else
    return (
      <div className="flex items-center">
        <Avatar className="size-8">
          {session.user.image && (
            <AvatarImage
              src={session.user.image}
              alt={session.user.name ?? ""}
            />
          )}
          <AvatarFallback>{session.user.email}</AvatarFallback>
        </Avatar>
        <SignOut />
      </div>
    );
}
