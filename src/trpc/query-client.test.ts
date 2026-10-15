import { describe, expect, test } from "vitest";

import { makeQueryClient } from "./query-client";

describe("makeQueryClient", () => {
  test("configures an SSR-safe cache that dehydrates pending queries", () => {
    const queryClient = makeQueryClient();
    const defaultOptions = queryClient.getDefaultOptions();

    // A non-zero stale time keeps hydrated server data from refetching on mount.
    expect(defaultOptions.queries?.staleTime).toBeGreaterThan(0);

    const pendingQuery = {
      state: { status: "pending" },
    };

    expect(
      defaultOptions.dehydrate?.shouldDehydrateQuery?.(pendingQuery as never),
    ).toBe(true);
    expect(defaultOptions.dehydrate?.shouldRedactErrors?.(new Error())).toBe(
      false,
    );
  });

  test("round-trips rich values from server dehydration to client hydration", () => {
    const { dehydrate, hydrate } = makeQueryClient().getDefaultOptions();
    const updatedAt = new Date("2026-03-24T10:30:00.000Z");

    const restored = hydrate?.deserializeData?.(
      JSON.parse(JSON.stringify(dehydrate?.serializeData?.({ updatedAt }))),
    );

    expect(restored).toEqual({ updatedAt });
  });
});
