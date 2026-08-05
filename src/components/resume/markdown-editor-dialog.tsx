"use client";

import { useEffect, useId, useState } from "react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

interface MarkdownEditorDialogProps {
  description: string;
  fieldLabel: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (value: string) => void;
  open: boolean;
  title: string;
  value: string;
}

export function MarkdownEditorDialog({
  description,
  fieldLabel,
  isPending,
  onOpenChange,
  onSave,
  open,
  title,
  value,
}: MarkdownEditorDialogProps) {
  const editorId = useId();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form
          className="grid gap-6"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(draft);
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor={editorId}>{fieldLabel}</Label>
            <Textarea
              id={editorId}
              className="min-h-72 resize-y font-mono"
              disabled={isPending}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (
                  (event.ctrlKey || event.metaKey) &&
                  (event.key === "Enter" || event.key === "NumpadEnter")
                ) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Tip: press {"⌘"}/Ctrl + Enter to save.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
