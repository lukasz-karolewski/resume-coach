import type React from "react";
import { MarkdownContent } from "../ui/markdownContent";
import { ResumeItemActions } from "./resume-item-controls";

interface SummaryProps {
  info: string;
  onEdit?: () => void;
}

export const ProfessionalSummary: React.FC<SummaryProps> = ({
  info,
  onEdit,
}) => {
  return (
    <div
      className="group/item relative flex flex-col gap-2 rounded-sm text-justify text-sm outline-none focus-within:ring-2 focus-within:ring-ring/50"
      onDoubleClick={onEdit}
    >
      <MarkdownContent>{info}</MarkdownContent>
      <ResumeItemActions label="professional summary" onEdit={onEdit} />
    </div>
  );
};
