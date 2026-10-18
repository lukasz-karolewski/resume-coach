"use client";

import {
  CheckIcon,
  ChevronDownIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  PlusIcon,
  Squares2X2Icon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import Link from "next/link";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  type ResumeSectionType,
  resumeSectionOptions,
} from "~/lib/resume-sections";

type ResumeActionsMenuProps = {
  addedSectionTypes: ReadonlySet<ResumeSectionType>;
  isAddingSection: boolean;
  isCopyingMarkdown: boolean;
  isDeleting: boolean;
  isDuplicating: boolean;
  onAddSection: (type: ResumeSectionType) => void;
  onCopyMarkdown: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  previewHref: string;
  resumeName: string;
};

/**
 * Secondary resume actions, collapsed behind a chevron next to the resume
 * title so the toolbar only carries share and print as standalone buttons.
 * The delete confirmation lives outside the menu so it survives the menu
 * closing when the item is picked.
 */
export function ResumeActionsMenu({
  addedSectionTypes,
  isAddingSection,
  isCopyingMarkdown,
  isDeleting,
  isDuplicating,
  onAddSection,
  onCopyMarkdown,
  onDelete,
  onDuplicate,
  previewHref,
  resumeName,
}: ResumeActionsMenuProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label="Resume actions"
              className="cursor-pointer"
              size="icon-sm"
              variant="ghost"
            />
          }
        >
          <ChevronDownIcon className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={isAddingSection}>
                <PlusIcon />
                Add section
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-48">
                {resumeSectionOptions.map((option) => {
                  const isAdded = addedSectionTypes.has(option.type);

                  return (
                    <DropdownMenuItem
                      disabled={isAdded || isAddingSection}
                      key={option.type}
                      onClick={() => onAddSection(option.type)}
                    >
                      {isAdded ? <CheckIcon /> : null}
                      {option.label}
                      {isAdded ? (
                        <DropdownMenuShortcut>Added</DropdownMenuShortcut>
                      ) : null}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem render={<Link href={previewHref} />}>
              <EyeIcon />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isCopyingMarkdown}
              onClick={onCopyMarkdown}
            >
              <ClipboardDocumentIcon />
              Copy as markdown
            </DropdownMenuItem>
            <DropdownMenuItem disabled={isDuplicating} onClick={onDuplicate}>
              <Squares2X2Icon />
              Duplicate
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isDeleting}
            onClick={() => setIsConfirmingDelete(true)}
            variant="destructive"
          >
            <TrashIcon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog
        onOpenChange={setIsConfirmingDelete}
        open={isConfirmingDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete resume?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{resumeName}" and its associated
              resume data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
