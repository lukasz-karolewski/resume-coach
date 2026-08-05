import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";

import type { AppRouter } from "~/server/api/root";

type TRPC = TRPCOptionsProxy<AppRouter>;

export function accomplishmentProfileQuery(trpc: TRPC) {
  return trpc.profile.getAccomplishmentProfile.queryOptions();
}

export function userInformationQuery(trpc: TRPC) {
  return trpc.profile.getUserInfo.queryOptions();
}
