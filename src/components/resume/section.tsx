import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";

interface SectionProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  children: ReactNode;
  layout?: "standard" | "compact";
}

const Section = ({
  title,
  children,
  layout = "standard",
  ...rest
}: SectionProps) => (
  <div className="group" {...rest}>
    <h2
      className={`top-0 mb-4 flex flex-row justify-between border-b-2 border-b-gray-300 bg-white text-2xl font-semibold`}
    >
      {title}

      <div className="hidden cursor-pointer group-hover:block print:hidden group-hover:print:hidden">
        <Link href={`/summary`}>edit</Link>
      </div>
    </h2>
    <div
      className={`flex flex-col ${layout === "standard" && "gap-8"}  ${layout === "compact" && "gap-4"}`}
    >
      {children}
    </div>
  </div>
);

export default Section;
