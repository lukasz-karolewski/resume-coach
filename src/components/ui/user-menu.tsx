"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { signOut } from "~/auth-client";

import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

type UserMenuProps = {
  email: string;
  image?: string | null;
  initials: string;
  name?: string | null;
};

export function UserMenu({ email, image, initials, name }: UserMenuProps) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto rounded-full p-1">
          <Avatar className="size-9 border border-border">
            {image ? <AvatarImage src={image} alt={name ?? ""} /> : null}
            <AvatarFallback className="bg-muted text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-1">
          <p className="font-medium">{name ?? "Signed in user"}</p>
          <p className="text-xs font-normal text-muted-foreground">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Account</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={async () => {
            await signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push("/login");
                },
              },
            });
          }}
        >
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
