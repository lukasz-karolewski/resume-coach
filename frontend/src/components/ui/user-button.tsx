import { auth } from "~/auth";

import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import { SignIn, SignOut } from "./buttons-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export default async function UserButton() {
  const session = await auth();
  if (!session?.user) return <SignIn />;
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
  // TODO below fails with "Form submission cancelled because the form is not connected error?"
  // return (
  //   <DropdownMenu>
  //     <DropdownMenuTrigger asChild>
  //       <Button variant="ghost" className="relative w-8 h-8 rounded-full">
  //         <Avatar className="w-8 h-8">
  //           {session.user.image && (
  //             <AvatarImage
  //               src={session.user.image}
  //               alt={session.user.name ?? ""}
  //             />
  //           )}
  //           <AvatarFallback>{session.user.email}</AvatarFallback>
  //         </Avatar>
  //       </Button>
  //     </DropdownMenuTrigger>
  //     <DropdownMenuContent className="w-56 bg-white" align="end" forceMount>
  //       <DropdownMenuLabel className="font-normal">
  //         <div className="flex flex-col space-y-1">
  //           <p className="text-sm font-medium leading-none">
  //             {session.user.name}
  //           </p>
  //           <p className="text-xs leading-none text-muted-foreground">
  //             {session.user.email}
  //           </p>
  //         </div>
  //       </DropdownMenuLabel>
  //       <DropdownMenuItem>
  //         <div>
  //           <SignOut />
  //         </div>
  //       </DropdownMenuItem>
  //     </DropdownMenuContent>
  //   </DropdownMenu>
  // );
}
