"use client";

import { PencilSquareIcon, PlusIcon } from "@heroicons/react/20/solid";
import type { ComponentProps } from "react";
import { Button } from "~/components/ui/button";
import { ConfirmDeleteButton } from "~/components/ui/confirm-delete-button";
import { cn } from "~/lib/utils";

interface ResumeItemActionsProps {
  /** Describes the item, e.g. "patent Adaptive cache"; prefixed with the verb. */
  label: string;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

/**
 * Edit and delete controls for one resume item, in a row under it. Like every
 * editing control on the resume, they are hidden when printing.
 */
export function ResumeItemActions({
  label,
  onEdit,
  onDelete,
  className,
}: ResumeItemActionsProps) {
  if (!onEdit && !onDelete) return null;

  return (
    <div className={cn("mt-1 flex justify-end gap-1 print:hidden", className)}>
      {onEdit ? (
        <Button
          aria-label={`Edit ${label}`}
          size="xs"
          type="button"
          variant="ghost"
          onClick={onEdit}
        >
          <PencilSquareIcon data-icon="inline-start" />
          Edit
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

/** Dashed placeholder in a section for adding another item. */
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
