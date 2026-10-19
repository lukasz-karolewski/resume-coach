import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "~/lib/utils";

interface SectionProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  children: ReactNode;
  action?: ReactNode;
  layout?: "standard" | "compact";
}

const Section = ({
  title,
  children,
  action,
  layout = "standard",
  className,
  ...rest
}: SectionProps) => (
  <div className={cn("group/section", className)} {...rest}>
    <div className="mb-4 flex items-center border-b-2 border-b-gray-300 bg-white">
      <h2 className="top-0 flex-1 text-2xl font-semibold">{title}</h2>
      {action}
    </div>
    <div
      className={`flex flex-col ${layout === "standard" && "gap-8"}  ${layout === "compact" && "gap-4"}`}
    >
      {children}
    </div>
  </div>
);

export default Section;
