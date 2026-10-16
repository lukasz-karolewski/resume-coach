import {
  BriefcaseIcon,
  DocumentTextIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import {
  BriefcaseIcon as BriefcaseSolidIcon,
  DocumentTextIcon as DocumentTextSolidIcon,
  UserCircleIcon as UserCircleSolidIcon,
} from "@heroicons/react/24/solid";

type NavIcon = typeof BriefcaseIcon;

type NavItem = {
  activeIcon: NavIcon;
  href: `/${string}`;
  icon: NavIcon;
  label: string;
};

/** Primary sections of the signed-in app, shared by the top and bottom navs. */
const navItems: NavItem[] = [
  {
    activeIcon: BriefcaseSolidIcon,
    href: "/jobs",
    icon: BriefcaseIcon,
    label: "Jobs",
  },
  {
    activeIcon: DocumentTextSolidIcon,
    href: "/resume",
    icon: DocumentTextIcon,
    label: "Resumes",
  },
  {
    activeIcon: UserCircleSolidIcon,
    href: "/profile",
    icon: UserCircleIcon,
    label: "Profile",
  },
];

function isNavItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export type { NavItem };
export { isNavItemActive, navItems };
