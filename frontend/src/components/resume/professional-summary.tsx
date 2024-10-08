import React from "react";

interface SummaryProps {
  info: string[];
}

export const ProfessionalSummary: React.FC<SummaryProps> = ({ info }) => {
  return (
    <div className="flex flex-col gap-2 text-justify text-sm">
      {info.map((item, index) => (
        <p key={index}>{item}</p>
      ))}
    </div>
  );
};
