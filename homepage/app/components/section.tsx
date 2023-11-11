import { ReactNode } from "react";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <div className="flex gap-4 flex-col">
    <h2 className={`text-2xl font-semibold border-b-2 border-b-gray-300`}>
      {title}
    </h2>

    {children}
  </div>
);

export default Section;
