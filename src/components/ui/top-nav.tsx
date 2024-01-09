import UserButton from "./user-button";

const TopNav: React.FC = async () => {
  return (
    <nav className=" print:hidden">
      <div className="mx-auto flex max-w-4xl items-center gap-8  p-4">
        <h1>Resume Coach</h1>

        <div className="grow"></div>

        <UserButton />
      </div>
    </nav>
  );
};

export default TopNav;
