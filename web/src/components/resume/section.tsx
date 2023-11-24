import Link from "next/link";
import { ReactNode, HTMLAttributes } from "react";

interface SectionProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  children: ReactNode;
}

const Section = ({ title, children, ...rest }: SectionProps) => (
  <div className="group flex flex-col gap-4" {...rest}>
    <h2
      className={`sticky top-0 flex flex-row justify-between border-b-2 border-b-gray-300 bg-white text-2xl font-semibold`}
    >
      {title}

      <div className="hidden cursor-pointer group-hover:block print:hidden">
        <Link href={`/summary`}>edit</Link>
      </div>
    </h2>

    {children}
  </div>
);

export default Section;
