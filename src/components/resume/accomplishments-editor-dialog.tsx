import { MarkdownEditorDialog } from "~/components/resume/markdown-editor-dialog";

interface AccomplishmentsEditorDialogProps {
  accomplishments: string;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (accomplishments: string) => void;
  open: boolean;
  positionTitle: string;
}

export function AccomplishmentsEditorDialog({
  accomplishments,
  isPending,
  onOpenChange,
  onSave,
  open,
  positionTitle,
}: AccomplishmentsEditorDialogProps) {
  return (
    <MarkdownEditorDialog
      description={`${positionTitle}. Use Markdown bullets to keep the resume format.`}
      fieldLabel="Accomplishments (Markdown)"
      isPending={isPending}
      onOpenChange={onOpenChange}
      onSave={onSave}
      open={open}
      title="Edit accomplishments"
      value={accomplishments}
    />
  );
}
