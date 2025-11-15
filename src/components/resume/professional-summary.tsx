import Markdown from "markdown-to-jsx";
import type React from "react";

interface SummaryProps {
  info: string | string[];
}

export const ProfessionalSummary: React.FC<SummaryProps> = ({ info }) => {
  const content = Array.isArray(info) ? info.join("\n\n") : info;

  return (
    <div className="flex flex-col gap-2 text-justify text-sm">
      <Markdown options={{ forceBlock: true }}>{content}</Markdown>
    </div>
  );
};
