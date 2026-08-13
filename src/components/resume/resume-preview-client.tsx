"use client";

import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { useSuspenseQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { useTRPC } from "~/trpc/react";

import { resumeDetailQuery } from "./resume-queries";

const ResumePdfViewer = dynamic(() => import("./resume-pdf-viewer"), {
  loading: () => (
    <div
      className="flex h-full min-h-[42rem] items-center justify-center bg-muted text-sm text-muted-foreground"
      role="status"
    >
      Rendering paginated preview…
    </div>
  ),
  ssr: false,
});

export default function ResumePreviewClient({
  resumeId,
}: {
  resumeId: string;
}) {
  const trpc = useTRPC();
  const { data: resume } = useSuspenseQuery(resumeDetailQuery(trpc, resumeId));

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            render={<Link href={`/resume/${resume.id}`} />}
            size="sm"
            variant="outline"
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Back to editor
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-semibold">{resume.name}</h1>
              <Badge variant="secondary">Preview</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[calc(100svh-13rem)] min-h-[42rem] overflow-hidden rounded-2xl border bg-muted shadow-sm">
        <ResumePdfViewer resume={resume} />
      </div>
    </div>
  );
}
