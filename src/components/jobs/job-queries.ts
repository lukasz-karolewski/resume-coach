import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";

import type { AppRouter } from "~/server/api/root";

type TRPC = TRPCOptionsProxy<AppRouter>;

export function jobListQuery(trpc: TRPC) {
  return trpc.job.getJobs.queryOptions();
}

export function resumesForJobQuery(trpc: TRPC) {
  return trpc.resume.list.queryOptions({ sort: "last-updated" });
}
