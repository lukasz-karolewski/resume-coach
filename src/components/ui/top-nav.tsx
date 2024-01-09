import Link from "next/link";

import UserButton from "./user-button";
const TopNav: React.FC = async () => {
  return (
    <nav className=" print:hidden">
      <div className="mx-auto flex max-w-4xl items-center gap-8  p-4">
        <Link href="/">
          <h1>Resume Coach</h1>
        </Link>

        <div className="grow">
          <Link href="/resume">static resume</Link>
        </div>

        <UserButton />
      </div>
    </nav>
  );
};

export default TopNav;
