import { ReactNode, HTMLAttributes } from "react";

interface SectionProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  children: ReactNode;
}

const Section = ({ title, children, ...rest }: SectionProps) => (
  <div className="flex gap-4 flex-col" {...rest}>
    <h2 className={`text-2xl font-semibold border-b-2 border-b-gray-300`}>
      {title}
    </h2>

    {children}
  </div>
);

export default Section;
