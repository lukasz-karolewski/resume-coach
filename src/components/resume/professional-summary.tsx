import { PencilSquareIcon } from "@heroicons/react/20/solid";
import type React from "react";
import { Button } from "../ui/button";
import { MarkdownContent } from "../ui/markdownContent";

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
      className="group/summary relative flex flex-col gap-2 rounded-sm text-justify text-sm outline-none focus-within:ring-2 focus-within:ring-ring/50"
      onDoubleClick={onEdit}
    >
      <MarkdownContent>{info}</MarkdownContent>
      {onEdit ? (
        <Button
          type="button"
          size="icon-xs"
          variant="ghost"
          aria-label="Edit professional summary"
          className="absolute -top-1 -right-7 opacity-0 transition-opacity group-hover/summary:opacity-100 focus:opacity-100 print:hidden"
          onClick={onEdit}
        >
          <PencilSquareIcon />
        </Button>
      ) : null}
    </div>
  );
};
