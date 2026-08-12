import { Suspense } from "react";

import { JobPageClient } from "~/components/jobs/job-page-client";
import {
  jobListQuery,
  resumesForJobQuery,
} from "~/components/jobs/job-queries";
import PageLoading from "~/components/ui/page-loading";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";

export default function JobsPage() {
  prefetch(jobListQuery(trpc));
  prefetch(resumesForJobQuery(trpc));

  return (
    <HydrateClient>
      <Suspense fallback={<PageLoading variant="table" />}>
        <JobPageClient />
      </Suspense>
    </HydrateClient>
  );
}
