import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "~/app/site-config";
import { cn } from "~/lib/utils";

type LogoProps = {
  className?: string;
  /** "responsive" keeps the name for screen readers but hides it below `sm`. */
  nameVisibility?: "always" | "responsive";
};

/** The app icon next to the product name, linking home. */
export function Logo({ className, nameVisibility = "responsive" }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 text-lg font-semibold tracking-tight whitespace-nowrap",
        className,
      )}
    >
      <Image
        src="/icon.svg"
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0"
        priority
      />
      <span
        className={cn(
          nameVisibility === "responsive" && "sr-only sm:not-sr-only",
        )}
      >
        {siteConfig.name}
      </span>
    </Link>
  );
}
