import Link from "~/components/ui/link";

import UserButton from "./user-button";

const TopNav: React.FC = async () => {
  return (
    <nav className=" print:hidden">
      <div className="mx-auto flex max-w-4xl items-center gap-8  p-4">
        <Link href="/">
          <h1>Resume Coach</h1>
        </Link>

        <div className="flex grow gap-4">
          <Link className="hover:underline" href="/profile">
            profile
          </Link>
          <Link className="hover:underline" href="/resume">
            jobs & resumes
          </Link>
        </div>

        <UserButton />
      </div>
    </nav>
  );
};

export default TopNav;
