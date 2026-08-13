"use client";

import dynamic from "next/dynamic";
import type { ResumePdfData } from "~/components/resume/resume-pdf-viewer";

const ResumePdfViewer = dynamic(() => import("./resume-pdf-viewer"), {
  loading: () => (
    <div
      className="flex min-h-dvh items-center justify-center bg-muted text-sm text-muted-foreground"
      role="status"
    >
      Rendering resume…
    </div>
  ),
  ssr: false,
});

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
