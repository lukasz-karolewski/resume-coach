"use client";

import { PencilSquareIcon, PlusIcon } from "@heroicons/react/20/solid";
import type { ComponentProps } from "react";
import { Button } from "~/components/ui/button";
import { ConfirmDeleteButton } from "~/components/ui/confirm-delete-button";
import { cn } from "~/lib/utils";

// Editing controls stay out of the way of a mouse user reading the resume:
// with a precise pointer they appear while the item is hovered or a control is
// focused. Touch devices cannot hover, so there they are always visible.
// Every control is hidden when printing.
export const revealOnItemHoverClass =
  "transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover/item:opacity-100 pointer-fine:focus-within:opacity-100 print:hidden";
export const revealOnSectionHoverClass =
  "transition-opacity pointer-fine:opacity-0 pointer-fine:group-hover/section:opacity-100 pointer-fine:focus-within:opacity-100 print:hidden";

interface ResumeItemActionsProps {
  /** Describes the item, e.g. "patent Adaptive cache"; prefixed with the verb. */
  label: string;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

/**
 * Edit and delete controls for one resume item. The item root must carry
 * `group/item relative`. Below `sm` they sit in a row under the item; from `sm`
 * up they float in the page gutter to the right of it.
 */
export function ResumeItemActions({
  label,
  onEdit,
  onDelete,
  className,
}: ResumeItemActionsProps) {
  if (!onEdit && !onDelete) return null;

  return (
    <div
      className={cn(
        "mt-1 flex justify-end gap-1 sm:absolute sm:top-0 sm:-right-9 sm:mt-0 sm:flex-col",
        revealOnItemHoverClass,
        className,
      )}
    >
      {onEdit ? (
        <Button
          aria-label={`Edit ${label}`}
          size="icon-xs"
          type="button"
          variant="ghost"
          onClick={onEdit}
        >
          <PencilSquareIcon />
        </Button>
      ) : null}
      {onDelete ? (
        <ResumeItemDeleteButton label={label} onDelete={onDelete} />
      ) : null}
    </div>
  );
}

/** Confirmed delete for one resume item; `label` as in `ResumeItemActions`. */
export function ResumeItemDeleteButton({
  label,
  onDelete,
  ...rest
}: {
  label: string;
  onDelete: () => void;
} & Pick<ComponentProps<typeof ConfirmDeleteButton>, "className" | "icon">) {
  return (
    <ConfirmDeleteButton
      confirmLabel="Delete"
      description="This permanently removes it from this resume."
      label={`Delete ${label}`}
      title={`Delete ${label}?`}
      onConfirm={onDelete}
      {...rest}
    />
  );
}

/** Dashed placeholder at the end of a section for adding another item. */
export function ResumeAddItemButton({
  itemLabel,
  onClick,
  className,
}: {
  itemLabel: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      className={cn(
        "w-full rounded-md border-dashed text-muted-foreground shadow-none hover:text-foreground print:hidden",
        className,
      )}
      size="sm"
      type="button"
      variant="outline"
      onClick={onClick}
    >
      <PlusIcon data-icon="inline-start" />
      Add {itemLabel}
    </Button>
  );
}
