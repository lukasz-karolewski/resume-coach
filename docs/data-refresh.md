# Data fetching and refresh

Route data that can change after a client mutation lives in the TanStack Query
cache. Do not prop-drill server-component data into interactive pages — the
cache, not a re-render of the server tree, is what makes the screen current.

## Page pattern

- Keep `page.tsx` thin: compute route/search params, `prefetch(...)` the shared
  query options, then return the body inside `PrefetchBoundary`
  (`src/trpc/hydrate-client.tsx`) with a route-shaped skeleton as `fallback`.
  See ui-patterns.md for the boundary's placement rules.
- Move the route body into a client component that reads data with
  `useSuspenseQuery` / `useSuspenseInfiniteQuery`.
- Put shared query options in a local `*-queries.ts` when both the server page
  and the client body use the query. **Inputs must match exactly**, or the
  client refetches instead of hydrating.
- For cursor lists, include the page size and `getNextPageParam` in the shared
  factory.

## Mutations

- **Never `router.refresh()` after a tRPC mutation.** Invalidate the cache
  instead.
- Invalidate every router whose data changed with `queryClient.invalidateQueries`.
- Prefer `trpc.<router>.pathFilter()` unless a narrow `queryFilter(...)` is
  clearly sufficient.
- Where instant feedback matters (a balance moving behind a dialog), use the
  shared optimistic mutation options (`~/lib/kid-money-actions`) rather than
  hand-rolling `onMutate`/`onError` per call site.

## Tests

- Page tests mock the server tRPC module, assert the expected `prefetch(...)`
  calls, and assert the client body is inside the hydration boundary.
- Client body tests mock `useTRPC` and the suspense hooks, resolving data by
  query key.
- Query factory tests assert the shared inputs once.
- Mutation tests capture `mutationOptions(...)` and call `onSettled`,
  `onMutate`, or `onError` directly to verify invalidation and rollback.
