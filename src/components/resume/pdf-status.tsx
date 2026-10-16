import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

export const PDF_ERROR_MESSAGE = "Could not render the PDF.";

/** Centred loading or error message shown in place of a PDF preview. */
export function PdfStatus({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-muted text-sm text-muted-foreground",
        className,
      )}
      role="status"
    >
      {children}
    </div>
  );
}
