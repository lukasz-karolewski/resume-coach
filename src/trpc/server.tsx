import "server-only";

import {
  dehydrate,
  type FetchQueryOptions,
  HydrationBoundary,
  type QueryKey,
} from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { headers } from "next/headers";
import { cache } from "react";

import { appRouter } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

import { makeQueryClient } from "./query-client";

export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: async () =>
    createTRPCContext({
      headers: await headers(),
    }),
  queryClient: getQueryClient,
  router: appRouter,
});

export function prefetch<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
>(queryOptions: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  void getQueryClient().prefetchQuery(queryOptions);
}

export function HydrateClient({ children }: { children: React.ReactNode }) {
  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {children}
    </HydrationBoundary>
  );
}
