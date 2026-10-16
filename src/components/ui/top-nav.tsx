import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import UserButton from "./user-button";

const TopNav: React.FC = async () => {
  return (
    <nav className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Logo className="mr-auto sm:mr-2" />

        {/* Phones get the floating `BottomNav` instead (rendered by the
            layout, outside this blurred bar so `fixed` stays viewport-relative). */}
        <NavLinks className="hidden sm:flex sm:grow" />

        <UserButton />
      </div>
    </nav>
  );
};

export default TopNav;
