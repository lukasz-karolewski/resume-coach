import Link from "next/link";

import { cn } from "~/lib/utils";

import { buttonVariants } from "./button";
import UserButton from "./user-button";

const TopNav: React.FC = async () => {
  return (
    <nav className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex-nowrap sm:px-6 sm:py-4">
        <Link
          href="/"
          className="mr-auto whitespace-nowrap text-lg font-semibold tracking-tight sm:mr-2"
        >
          Resume Coach
        </Link>

        {/* Below `sm` the links drop to their own full-width row so the brand,
            links, and avatar never overflow a phone-width viewport. */}
        <div className="order-last -mx-2.5 flex w-full items-center gap-1 sm:order-none sm:mx-0 sm:w-auto sm:grow sm:gap-2">
          <Link
            href="/jobs"
            className={cn(buttonVariants({ size: "sm", variant: "ghost" }))}
          >
            Jobs
          </Link>
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
