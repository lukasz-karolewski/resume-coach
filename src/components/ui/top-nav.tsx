import UserButton from "./user-button";

const TopNav: React.FC = async () => {
  return (
    <nav className="flex items-center gap-8 p-4 print:hidden">
      <h1>AI Resume Coach</h1>

      <div className="grow"></div>

      <UserButton />
    </nav>
  );
};

export default TopNav;
