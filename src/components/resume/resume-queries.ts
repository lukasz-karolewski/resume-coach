import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";

import type { AppRouter } from "~/server/api/root";

import type { ResumeSort } from "./resume-sort";

type TRPC = TRPCOptionsProxy<AppRouter>;

export function accomplishmentProfileForResumeQuery(trpc: TRPC) {
  return trpc.profile.getAccomplishmentProfile.queryOptions();
}

export function jobsForResumeQuery(trpc: TRPC) {
  return trpc.job.getJobs.queryOptions();
}

export function resumeDetailQuery(trpc: TRPC, id: number) {
  return trpc.resume.getById.queryOptions({ id });
}

export function resumeListQuery(trpc: TRPC, sort: ResumeSort) {
  return trpc.resume.list.queryOptions({ sort });
}
