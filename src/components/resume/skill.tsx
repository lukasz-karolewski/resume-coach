import type React from "react";
import { Button } from "~/components/ui/button";

import Section from "./section";

interface SkillProps {
  children: string;
  onEdit?: () => void;
}

export const Skill: React.FC<SkillProps> = ({ children, onEdit }) => {
  if (onEdit) {
    return (
      <Button
        aria-label={`Edit skill ${children}`}
        className="h-auto rounded-sm bg-gray-200 px-1 py-0.5 text-xs text-black hover:bg-gray-300"
        type="button"
        variant="ghost"
        onClick={onEdit}
      >
        {children}
      </Button>
    );
  }

  return <span className="rounded-sm bg-gray-200 px-1 py-0.5">{children}</span>;
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
