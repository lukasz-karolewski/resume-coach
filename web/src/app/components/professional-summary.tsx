import React from "react";

interface SummaryProps {
  text: string;
}

export const ProfessionalSummary: React.FC<SummaryProps> = ({ text }) => {
  return (
    <>
      {text.split("\n").map((paragraph, index) => {
        return (
          <p key={index} className="text-justify text-sm">
            {paragraph.trim()}
          </p>
        );
      })}
    </>
  );
};
