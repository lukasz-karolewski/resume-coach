"use client";

import { PencilSimpleIcon } from "@phosphor-icons/react";
import { type KeyboardEvent, useState } from "react";

import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

type InlineEditProps = {
  /** Accessible name of the field, e.g. "Passkey name". */
  label: string;
  /** Called with the trimmed new value when it differs from `value`. */
  onSave: (value: string) => Promise<unknown> | unknown;
  /** Shown when `value` is empty. */
  placeholder?: string;
  className?: string;
  value: string;
};

/**
 * Text that turns into an input in place. Enter or blur saves, Escape
 * cancels; an empty or unchanged value is discarded.
 */
export function InlineEdit({
  className,
  label,
  onSave,
  placeholder,
  value,
}: InlineEditProps) {
  const [draft, setDraft] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const shown = value || placeholder || "";

  const commit = async () => {
    if (isSaving) return;
    const next = draft?.trim();
    if (!next || next === value) {
      setDraft(undefined);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(next);
    } finally {
      setIsSaving(false);
      setDraft(undefined);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setDraft(undefined);
    }
  };

  if (draft !== undefined) {
    return (
      <Input
        aria-label={label}
        autoFocus
        className={cn("h-8 px-2.5", className)}
        disabled={isSaving}
        onBlur={commit}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={(event) => event.currentTarget.select()}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        value={draft}
      />
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
