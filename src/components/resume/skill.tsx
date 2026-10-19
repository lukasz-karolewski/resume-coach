import { XMarkIcon } from "@heroicons/react/20/solid";
import type React from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import {
  ResumeItemDeleteButton,
  revealOnItemHoverClass,
} from "./resume-item-controls";
import Section from "./section";

interface SkillProps {
  children: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const Skill: React.FC<SkillProps> = ({ children, onEdit, onDelete }) => {
  if (onEdit) {
    return (
      <span className="group/item relative inline-flex">
        <Button
          aria-label={`Edit skill ${children}`}
          className="h-auto rounded-sm bg-gray-200 px-1 py-0.5 text-xs text-black hover:bg-gray-300"
          type="button"
          variant="ghost"
          onClick={onEdit}
        >
          {children}
        </Button>
        {onDelete ? (
          <span
            className={cn("absolute -top-2 -right-2", revealOnItemHoverClass)}
          >
            <ResumeItemDeleteButton
              className="size-4 border bg-white shadow-xs [&_svg:not([class*='size-'])]:size-2.5"
              icon={<XMarkIcon />}
              label={`skill ${children}`}
              onDelete={onDelete}
            />
          </span>
        ) : null}
      </span>
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
