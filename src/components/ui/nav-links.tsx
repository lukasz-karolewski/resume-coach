"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "~/lib/utils";

import { buttonVariants } from "./button";
import { isNavItemActive, navItems } from "./nav-items";

/** The shared nav items, each flagged with whether it is the current section. */
function useNavItems() {
  const pathname = usePathname();
  return navItems.map((item) => ({
    ...item,
    active: isNavItemActive(pathname, item.href),
  }));
}

/** Inline section links for the desktop header. */
export function NavLinks({ className }: { className?: string }) {
  const items = useNavItems();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {items.map(({ active, href, label }) => (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className={buttonVariants({
            size: "sm",
            variant: active ? "secondary" : "ghost",
          })}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

/** Floating tab bar that replaces the header links on phones. */
export function BottomNav() {
  const items = useNavItems();

  return (
    <nav
      aria-label="Primary"
      data-bottom-nav
      className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto max-w-sm rounded-full border bg-background/90 p-1.5 shadow-lg shadow-black/10 backdrop-blur sm:hidden print:hidden"
    >
      <ul className="grid grid-cols-3">
        {items.map(({ active, activeIcon, href, icon, label }) => {
          const ItemIcon = active ? activeIcon : icon;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "hover:text-foreground",
                )}
              >
                <ItemIcon aria-hidden className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
