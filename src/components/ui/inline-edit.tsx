"use client";

import { PencilSimpleIcon } from "@phosphor-icons/react";
import { type FocusEvent, type KeyboardEvent, useRef, useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

type InlineEditProps = {
  /** Accessible name of the field, e.g. "Passkey name". */
  label: string;
  /** Lets the surrounding row hide what does not apply while editing. */
  onEditingChange?: (editing: boolean) => void;
  /** Called with the trimmed new value when it differs from `value`. */
  onSave: (value: string) => Promise<unknown> | unknown;
  /** Shown when `value` is empty. */
  placeholder?: string;
  className?: string;
  value: string;
};

/**
 * Text that turns into an input with a Save button in place. Enter, Save or
 * blur saves, Escape cancels; an empty or unchanged value is discarded.
 */
export function InlineEdit({
  className,
  label,
  onEditingChange,
  onSave,
  placeholder,
  value,
}: InlineEditProps) {
  const [draft, setDraftState] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  // Blur and submit can both fire for one tap on Save (Safari does not focus
  // buttons), so guard synchronously rather than through state.
  const savingRef = useRef(false);
  const shown = value || placeholder || "";

  const setDraft = (next: string | undefined) => {
    setDraftState(next);
    onEditingChange?.(next !== undefined);
  };

  const commit = async () => {
    if (savingRef.current) return;
    const next = draft?.trim();
    if (!next || next === value) {
      setDraft(undefined);
      return;
    }
    savingRef.current = true;
    setIsSaving(true);
    try {
      await onSave(next);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
      setDraft(undefined);
    }
  };

  const handleBlur = (event: FocusEvent<HTMLFormElement>) => {
    // Moving focus to the Save button is not leaving the editor.
    if (event.currentTarget.contains(event.relatedTarget)) return;
    void commit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setDraft(undefined);
    }
  };

  if (draft !== undefined) {
    return (
      <form
        className={cn("flex min-w-0 flex-1 items-center gap-2", className)}
        onBlur={handleBlur}
        onSubmit={(event) => {
          event.preventDefault();
          void commit();
        }}
      >
        <Input
          aria-label={label}
          autoFocus
          className="h-8 px-2.5"
          disabled={isSaving}
          onChange={(event) => setDraftState(event.target.value)}
          onFocus={(event) => event.currentTarget.select()}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          value={draft}
        />
        <Button disabled={isSaving} size="sm" type="submit">
          Save
        </Button>
      </form>
    );
  }

  return (
    <button
      aria-label={`Rename ${shown}`}
      className={cn(
        "group/inline-edit -mx-1.5 flex h-8 max-w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 text-left font-medium outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
      onClick={() => setDraft(value)}
      type="button"
    >
      <span className="truncate">{shown}</span>
      <PencilSimpleIcon
        aria-hidden
        className="size-3.5 shrink-0 text-muted-foreground opacity-60 group-hover/inline-edit:opacity-100"
      />
    </button>
  );
}
