"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "~/lib/utils";

import { buttonVariants } from "./button";
import { isNavItemActive, navItems } from "./nav-items";

/** Inline section links for the desktop header. */
export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {navItems.map(({ href, label }) => {
        const active = isNavItemActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              buttonVariants({
                size: "sm",
                variant: active ? "secondary" : "ghost",
              }),
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

/** Floating tab bar that replaces the header links on phones. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      data-bottom-nav
      className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto max-w-sm rounded-full border bg-background/90 p-1.5 shadow-lg shadow-black/10 backdrop-blur sm:hidden print:hidden"
    >
      <ul className="grid grid-cols-3">
        {navItems.map(({ activeIcon: ActiveIcon, href, icon: Icon, label }) => {
          const active = isNavItemActive(pathname, href);
          const ItemIcon = active ? ActiveIcon : Icon;
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
