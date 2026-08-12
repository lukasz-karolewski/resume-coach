"use client";

import {
  CheckIcon,
  ChevronDownIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  type ResumeSectionType,
  resumeSectionOptions,
} from "~/lib/resume-sections";

type AddResumeSectionDropdownProps = {
  addedSectionTypes: ReadonlySet<ResumeSectionType>;
  isPending: boolean;
  onAdd: (type: ResumeSectionType) => void;
};

export function AddResumeSectionDropdown({
  addedSectionTypes,
  isPending,
  onAdd,
}: AddResumeSectionDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            aria-label="Add section"
            disabled={isPending}
            size="sm"
            variant="outline"
          />
        }
      >
        <PlusIcon data-icon="inline-start" />
        Add section
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Resume sections</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {resumeSectionOptions.map((option) => {
          const isAdded = addedSectionTypes.has(option.type);

          return (
            <DropdownMenuItem
              disabled={isAdded || isPending}
              key={option.type}
              onClick={() => onAdd(option.type)}
            >
              {isAdded ? <CheckIcon /> : null}
              {option.label}
              {isAdded ? (
                <DropdownMenuShortcut>Added</DropdownMenuShortcut>
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
