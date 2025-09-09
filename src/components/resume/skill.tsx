import type React from "react";

import Section from "./section";

interface SkillProps {
  children: string;
}

export const Skill: React.FC<SkillProps> = ({ children }) => {
  return <span className="rounded bg-gray-200 px-1 py-0.5">{children}</span>;
};

interface SkillsProps {
  children: React.ReactNode;
}

export const Skills: React.FC<SkillsProps> = ({ children }) => {
  return (
    <Section title="Skills">
      <div className="flex flex-wrap gap-2 text-xs">{children}</div>
    </Section>
  );
};
