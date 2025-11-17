import type React from "react";
import { MarkdownContent } from "../ui/markdownContent";

interface SummaryProps {
  info: string;
}

export const ProfessionalSummary: React.FC<SummaryProps> = ({ info }) => {
  return (
    <div className="flex flex-col gap-2 text-justify text-sm">
      <MarkdownContent>{info}</MarkdownContent>
    </div>
  );
};
