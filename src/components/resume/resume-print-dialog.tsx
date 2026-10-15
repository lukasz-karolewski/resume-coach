"use client";

import { PrinterIcon } from "@heroicons/react/20/solid";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import type { ResumePdfData } from "~/lib/resume-pdf-select";

import { createResumePdfViewer } from "./resume-pdf-viewer-lazy";

const ResumePdfViewer = createResumePdfViewer(() => (
  <div
    className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground"
    role="status"
  >
    Rendering PDF…
  </div>
));

/**
 * Print opens the rendered PDF full screen instead of `window.print()`, so the
 * user prints (or downloads) exactly what the PDF export produces. The viewer
 * is sized to US Letter width so the page renders at its real proportions.
 */
export function ResumePrintDialog({ resume }: { resume: ResumePdfData }) {
  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger
              render={
                <Button
                  aria-label="Print resume"
                  className="cursor-pointer"
                  size="icon-sm"
                  variant="ghost"
                />
              }
            />
          }
        >
          <PrinterIcon className="size-4" />
        </TooltipTrigger>
        <TooltipContent>Print</TooltipContent>
      </Tooltip>
      <DialogContent className="top-0 left-0 flex h-svh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-none">
        <DialogHeader className="border-b px-6 py-4 pr-16">
          <DialogTitle className="truncate">{resume.name}</DialogTitle>
        </DialogHeader>
        <div className="flex min-h-0 flex-1 justify-center overflow-hidden bg-muted">
          <div className="h-full w-[8.5in] max-w-full">
            <ResumePdfViewer resume={resume} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
