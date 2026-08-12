import { notFound } from "next/navigation";
import { Suspense } from "react";

import ResumePreviewClient from "~/components/resume/resume-preview-client";
import { resumeDetailQuery } from "~/components/resume/resume-queries";
import PageLoading from "~/components/ui/page-loading";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";

export default async function ResumePreviewPage(props: {
  params: Promise<{ resume_id: string }>;
}) {
  const params = await props.params;
  const resumeId = Number.parseInt(params.resume_id, 10);

  if (Number.isNaN(resumeId)) {
    notFound();
  }

  prefetch(resumeDetailQuery(trpc, resumeId));

  return (
    <HydrateClient>
      <Suspense fallback={<PageLoading variant="document" />}>
        <ResumePreviewClient resumeId={resumeId} />
      </Suspense>
    </HydrateClient>
  );
}
