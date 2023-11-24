import Link from "next/link";
import { ReactNode, HTMLAttributes } from "react";

interface SectionProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  children: ReactNode;
}

const Section = ({ title, children, ...rest }: SectionProps) => (
  <div className="flex gap-4 flex-col group" {...rest}>
    <h2
      className={`text-2xl font-semibold border-b-2 border-b-gray-300 flex flex-row justify-between sticky top-0 bg-white`}
    >
      {title}

      <div className="print:hidden group-hover:block hidden cursor-pointer">
        <Link href={`/summary`}>edit</Link>
      </div>
    </h2>

    {children}
  </div>
);

export default Section;
