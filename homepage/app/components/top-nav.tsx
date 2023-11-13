import UserButton from "./user-button";

const TopNav: React.FC = async () => {
  return (
    <nav className="p-4 flex gap-8 print:hidden items-center">
      <h1>AI Assisted Resume</h1>

      <div className="flex-grow"></div>

      <UserButton />
    </nav>
  );
};

export default TopNav;
