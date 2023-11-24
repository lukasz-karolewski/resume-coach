import React from "react";
import Section from "./section";

interface SummaryProps {
  text: string;
}

export const ProfessionalSummary: React.FC<SummaryProps> = ({ text }) => {
  return (
    <Section title="Summary">
      {text.split("\n").map((paragraph, index) => {
        return (
          <p key={index} className="text-justify text-sm">
            {paragraph.trim()}
          </p>
        );
      })}
    </Section>
  );
};
