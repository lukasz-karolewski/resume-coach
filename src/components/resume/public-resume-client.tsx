"use client";

import type { ResumePdfData } from "~/components/resume/resume-pdf-viewer";

import { createResumePdfViewer } from "./resume-pdf-viewer-lazy";

const ResumePdfViewer = createResumePdfViewer(() => (
  <div
    className="flex min-h-dvh items-center justify-center bg-muted text-sm text-muted-foreground"
    role="status"
  >
    Rendering resume…
  </div>
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
