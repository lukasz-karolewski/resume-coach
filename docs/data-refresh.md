# Data Fetching And Refresh

Use the TanStack Query cache for route data that can change after a client
mutation. Avoid server-component prop drilling for interactive pages.

## Page Pattern

- Keep route `page.tsx` thin: compute route/search params, `prefetch(...)`
  shared query options, then render `<HydrateClient>` + `<Suspense>`.
- Move the route body into a client component that reads data with
  `useSuspenseQuery` or `useSuspenseInfiniteQuery`.
- Put shared query options in a local `*-queries.ts` file when both the server
  page and client component use the query. Query inputs must match exactly.
- Use route-shaped skeletons for Suspense fallbacks.
- For cursor lists, include the page size and `getNextPageParam` in the shared
  query factory.

## Mutations

- Do not call `router.refresh()` after tRPC mutations.
- Invalidate every router whose data changed with `queryClient.invalidateQueries`.
- Prefer `trpc.<router>.pathFilter()` unless a narrow `queryFilter(...)` is
  clearly sufficient.
- For child balance changes, use `optimisticChildBalanceOptions` from
  `~/lib/kid-money-actions` when instant balance feedback matters.

## Tests

- Page tests mock `~/trpc/server`, assert the expected `prefetch(...)` calls,
  and assert the client body is inside `HydrateClient`.
- Client body tests mock `useTRPC` and suspense hooks, resolving data by query
  key.
- Query factory tests assert shared inputs once.
- Mutation tests capture `mutationOptions(...)` and call `onSettled`,
  `onMutate`, or `onError` directly to verify invalidation and rollback.