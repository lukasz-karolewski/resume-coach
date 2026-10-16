"use client";

import type { ResumePdfData } from "~/components/resume/resume-pdf-viewer";

import { PdfStatus } from "./pdf-status";
import { createResumePdfViewer } from "./resume-pdf-viewer-lazy";

const ResumePdfViewer = createResumePdfViewer(() => (
  <PdfStatus className="min-h-dvh">Rendering resume…</PdfStatus>
));

export default function PublicResumeClient({
  resume,
}: {
  resume: ResumePdfData;
}) {
  return (
    <div className="h-dvh min-h-[36rem] overflow-hidden bg-muted">
      <ResumePdfViewer resume={resume} />
    </div>
  );
}
