import { Suspense } from "react";
import { ResumePageClient } from "~/components/resume/resume-page-client";
import {
  accomplishmentProfileForResumeQuery,
  jobsForResumeQuery,
  resumeListQuery,
} from "~/components/resume/resume-queries";
import { normalizeResumeSort } from "~/components/resume/resume-sort";
import PageLoading from "~/components/ui/page-loading";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";

type ResumePageProps = {
  searchParams?: Promise<{ sort?: string | string[] }>;
};

export default async function ResumePage({
  searchParams,
}: ResumePageProps = {}) {
  const resolvedSearchParams = await searchParams;
  const sort = normalizeResumeSort(resolvedSearchParams?.sort);

  prefetch(resumeListQuery(trpc, sort));
  prefetch(jobsForResumeQuery(trpc));
  prefetch(accomplishmentProfileForResumeQuery(trpc));

  return (
    <HydrateClient>
      <Suspense fallback={<PageLoading variant="cards" />}>
        <ResumePageClient sort={sort} />
      </Suspense>
    </HydrateClient>
  );
}
