"use client";

import { TrashIcon } from "@heroicons/react/20/solid";
import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface ConfirmDeleteButtonProps {
  /** Accessible name of the icon trigger, e.g. "Delete patent Foo". */
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
  icon?: ReactNode;
}

/**
 * Icon button that asks for confirmation in an alert dialog before running a
 * destructive action.
 */
export function ConfirmDeleteButton({
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
  disabled,
  className,
  icon = <TrashIcon />,
}: ConfirmDeleteButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            aria-label={label}
            className={cn("hover:text-destructive", className)}
            disabled={disabled}
            size="icon-xs"
            type="button"
            variant="ghost"
          />
        }
      >
        {icon}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
