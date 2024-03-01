import React from "react";

import Section from "./section";

interface SummaryProps {
  children: React.ReactElement<"p">[];
}

export const ProfessionalSummary: React.FC<SummaryProps> = ({ children }) => {
  return (
    <Section title="Summary">
      <div className="flex flex-col gap-2 text-justify text-sm">{children}</div>
    </Section>
  );
};
