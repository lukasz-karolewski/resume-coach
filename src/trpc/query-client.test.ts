import { describe, expect, test } from "vitest";

import { makeQueryClient } from "./query-client";

describe("makeQueryClient", () => {
  test("configures an SSR-safe cache that dehydrates pending queries", () => {
    const queryClient = makeQueryClient();
    const defaultOptions = queryClient.getDefaultOptions();

    expect(defaultOptions.queries?.staleTime).toBe(30_000);

    const pendingQuery = {
      state: { status: "pending" },
    };

    expect(
      defaultOptions.dehydrate?.shouldDehydrateQuery?.(pendingQuery as never),
    ).toBe(true);
    expect(defaultOptions.dehydrate?.serializeData).toBeTypeOf("function");
    expect(defaultOptions.dehydrate?.shouldRedactErrors?.(new Error())).toBe(
      false,
    );
    expect(defaultOptions.hydrate?.deserializeData).toBeTypeOf("function");
  });
});
