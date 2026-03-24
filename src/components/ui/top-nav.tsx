import Link from "next/link";

import { cn } from "~/lib/utils";

import { buttonVariants } from "./button-variants";
import UserButton from "./user-button";

const TopNav: React.FC = async () => {
  return (
    <nav className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
        <Link href="/" className="mr-2 text-lg font-semibold tracking-tight">
          Resume Coach
        </Link>

        <div className="flex grow items-center gap-2">
          <Link
            href="/resume"
            className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
          >
            Resumes
          </Link>
          <Link
            href="/profile"
            className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
          >
            Profile
          </Link>
        </div>

        <UserButton />
      </div>
    </nav>
  );
};

export default TopNav;
