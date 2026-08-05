import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";

import { transformer } from "./shared";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      dehydrate: {
        serializeData: transformer.serialize,
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
        shouldRedactErrors: () => false,
      },
      hydrate: {
        deserializeData: transformer.deserialize,
      },
      queries: {
        staleTime: 30_000,
      },
    },
  });
}
