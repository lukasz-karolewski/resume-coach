import { notFound } from "next/navigation";
import { Suspense } from "react";

import ResumePreviewClient from "~/components/resume/resume-preview-client";
import { resumeDetailQuery } from "~/components/resume/resume-queries";
import PageLoading from "~/components/ui/page-loading";
import { resumeIdSchema } from "~/lib/schemas/resume-identifiers";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";

export default async function ResumePreviewPage(props: {
  params: Promise<{ resume_id: string }>;
}) {
  const params = await props.params;
  const result = resumeIdSchema.safeParse(params.resume_id);

  if (!result.success) {
    notFound();
  }

  const resumeId = result.data;

  prefetch(resumeDetailQuery(trpc, resumeId));

  return (
    <HydrateClient>
      <Suspense fallback={<PageLoading variant="document" />}>
        <ResumePreviewClient resumeId={resumeId} />
      </Suspense>
    </HydrateClient>
  );
}
